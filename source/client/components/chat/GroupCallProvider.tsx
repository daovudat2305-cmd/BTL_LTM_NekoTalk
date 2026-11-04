"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { attachLocalStreamToPeer, getLocalMediaStream, ICE_CONFIGURATION, stopMediaStream, isPermissionIssue } from "@/lib/call/call-core";
import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";
import type { CallSignal } from "@/types";

type GroupCallPhase = "incoming" | "outgoing" | "connecting" | "active" | "error";
type CallType = "VOICE" | "VIDEO";

interface GroupCallMember {
  userId: string;
  username: string;
  joined: boolean;
  stream?: MediaStream;
}

interface GroupCallState {
  callId: string;
  conversationId: string;
  callerId: string;
  phase: GroupCallPhase;
  callType: CallType;
  members: GroupCallMember[];
  muted: boolean;
  cameraOff: boolean;
  elapsedSeconds: number;
  message?: string;
}

interface Invitee {
  userId: string;
  username: string;
}

interface GroupCallContextValue {
  startGroupCall: (conversationId: string, invitees: Invitee[], callType: CallType) => void;
}

const GroupCallContext = createContext<GroupCallContextValue | null>(null);

function MediaVideo({ stream, muted = false }: { stream?: MediaStream; muted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream ?? null;
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />;
}

function RemoteAudio({ stream }: { stream?: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.srcObject = stream ?? null;
    if (stream) void audioRef.current.play().catch(() => {
      toast.info("Cho phép phát âm thanh trong trình duyệt để nghe cuộc gọi.");
    });
  }, [stream]);

  return <audio ref={audioRef} autoPlay />;
}

export function useGroupCall() {
  const context = useContext(GroupCallContext);
  if (!context) throw new Error("useGroupCall must be used within GroupCallProvider");
  return context;
}

export default function GroupCallProvider({ children }: { children: ReactNode }) {
  const stompClient = useChatStore((state) => state.stompClient);
  const currentUser = useUserStore((state) => state.user);
  const userId = currentUser?.userId ?? "";
  const username = currentUser?.username ?? "Người dùng";
  const [call, setCall] = useState<GroupCallState | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const callRef = useRef<GroupCallState | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const offeredPeersRef = useRef(new Set<string>());

  const updateCall = useCallback((next: GroupCallState | null) => {
    callRef.current = next;
    setCall(next);
  }, []);

  const publish = useCallback((signal: CallSignal) => {
    if (!stompClient?.connected) throw new Error("Mất kết nối máy chủ. Hãy thử lại.");
    stompClient.publish({ destination: "/app/call.signal", body: JSON.stringify({ ...signal, groupCall: true }) });
  }, [stompClient]);

  const closeMedia = useCallback(() => {
    peerConnectionsRef.current.forEach((connection) => connection.close());
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    offeredPeersRef.current.clear();
    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const dismissCall = useCallback(() => {
    closeMedia();
    updateCall(null);
  }, [closeMedia, updateCall]);

  const ensureLocalStream = useCallback(async (current: GroupCallState) => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await getLocalMediaStream(current.callType);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const applyPendingCandidates = useCallback(async (peerId: string, connection: RTCPeerConnection) => {
    const pending = pendingCandidatesRef.current.get(peerId) ?? [];
    pendingCandidatesRef.current.delete(peerId);
    for (const candidate of pending) await connection.addIceCandidate(candidate);
  }, []);

  const ensurePeerConnection = useCallback(async (peerId: string, peerName: string, current: GroupCallState) => {
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) return existing;

    const stream = await ensureLocalStream(current);
    const connection = new RTCPeerConnection(ICE_CONFIGURATION);
    peerConnectionsRef.current.set(peerId, connection);
    attachLocalStreamToPeer(connection, stream);

    connection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;
      const latest = callRef.current;
      if (!latest || latest.callId !== current.callId) return;
      const members = latest.members.some((member) => member.userId === peerId)
        ? latest.members.map((member) => member.userId === peerId ? { ...member, username: peerName, joined: true, stream: remoteStream } : member)
        : [...latest.members, { userId: peerId, username: peerName, joined: true, stream: remoteStream }];
      updateCall({ ...latest, members });
    };

    connection.onicecandidate = (event) => {
      if (!event.candidate?.candidate) return;
      try {
        publish({
          type: "ICE",
          callId: current.callId,
          conversationId: current.conversationId,
          targetUserId: peerId,
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        });
      } catch {
        toast.error("Không thể gửi thông tin kết nối cuộc gọi.");
      }
    };

    connection.onconnectionstatechange = () => {
      const latest = callRef.current;
      if (!latest || latest.callId !== current.callId) return;
      if (connection.connectionState === "connected") {
        updateCall({ ...latest, phase: "active", members: latest.members.map((member) => member.userId === peerId ? { ...member, joined: true } : member) });
      } else if (connection.connectionState === "failed") {
        updateCall({ ...latest, members: latest.members.map((member) => member.userId === peerId ? { ...member, stream: undefined } : member) });
        toast.error(`Không kết nối được với ${peerName}.`);
      }
    };

    return connection;
  }, [ensureLocalStream, publish, updateCall]);

  const startGroupCall = useCallback((conversationId: string, invitees: Invitee[], callType: CallType) => {
    if (callRef.current) {
      toast.error("Bạn đang có một cuộc gọi khác.");
      return;
    }
    if (!userId || !stompClient?.connected) {
      toast.error("Đang kết nối máy chủ. Vui lòng thử lại sau.");
      return;
    }
    if (invitees.length === 0) {
      toast.error("Nhóm chưa có thành viên để mời.");
      return;
    }

    const nextCall: GroupCallState = {
      callId: crypto.randomUUID(),
      conversationId,
      callerId: userId,
      phase: "outgoing",
      callType,
      members: [
        { userId, username, joined: true },
        ...invitees.filter((invitee) => invitee.userId !== userId).map((invitee) => ({ ...invitee, joined: false })),
      ],
      muted: false,
      cameraOff: false,
      elapsedSeconds: 0,
    };
    updateCall(nextCall);
    try {
      publish({ type: "INVITE", callId: nextCall.callId, conversationId, callType });
    } catch (error) {
      updateCall({ ...nextCall, phase: "error", message: error instanceof Error ? error.message : "Không thể bắt đầu cuộc gọi." });
    }
  }, [publish, stompClient, updateCall, userId, username]);

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (!current || current.phase !== "incoming") return;
    try {
      await ensureLocalStream(current);
      publish({ type: "ACCEPT", callId: current.callId, conversationId: current.conversationId });
      updateCall({ ...current, phase: "connecting", members: current.members.map((member) => member.userId === userId ? { ...member, joined: true } : member) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể truy cập micro/camera.";
      try {
        publish({ type: "REJECT", callId: current.callId, conversationId: current.conversationId });
      } catch {
        // The socket may have closed while requesting media permission.
      }
      closeMedia();
      updateCall({ ...current, phase: "error", message: message.includes("denied") || message.includes("Permission")
        ? "Bạn chưa cấp quyền sử dụng micro hoặc máy ảnh."
        : message });
    }
  }, [closeMedia, ensureLocalStream, publish, updateCall, userId]);

  const rejectCall = useCallback(() => {
    const current = callRef.current;
    if (!current) return;
    try {
      publish({ type: "REJECT", callId: current.callId, conversationId: current.conversationId });
    } catch {
      toast.error("Đã mất kết nối với máy chủ.");
    }
    dismissCall();
  }, [dismissCall, publish]);

  const leaveCall = useCallback(() => {
    const current = callRef.current;
    if (!current) return;
    try {
      publish({ type: current.phase === "incoming" ? "REJECT" : current.phase === "outgoing" && current.callerId === userId ? "CANCEL" : "HANGUP",
        callId: current.callId, conversationId: current.conversationId });
    } catch {
      toast.error("Đã mất kết nối với máy chủ.");
    }
    dismissCall();
  }, [dismissCall, publish, userId]);

  const toggleMute = useCallback(() => {
    const current = callRef.current;
    const stream = localStreamRef.current;
    if (!current || !stream) return;
    const muted = !current.muted;
    stream.getAudioTracks().forEach((track) => { track.enabled = !muted; });
    updateCall({ ...current, muted });
  }, [updateCall]);

  const toggleCamera = useCallback(() => {
    const current = callRef.current;
    const stream = localStreamRef.current;
    if (!current || !stream || current.callType !== "VIDEO") return;
    const cameraOff = !current.cameraOff;
    stream.getVideoTracks().forEach((track) => { track.enabled = !cameraOff; });
    updateCall({ ...current, cameraOff });
  }, [updateCall]);

  useEffect(() => {
    if (!stompClient?.connected) return;
    const subscription: StompSubscription = stompClient.subscribe("/user/queue/calls", (message: IMessage) => {
      let signal: CallSignal;
      try {
        signal = JSON.parse(message.body) as CallSignal;
      } catch {
        toast.error("Nhận được tín hiệu cuộc gọi không hợp lệ.");
        return;
      }
      if (!signal.groupCall) return;

      const current = callRef.current;
      if (signal.type === "INVITE") {
        if (current) {
          try { publish({ type: "REJECT", callId: signal.callId, conversationId: signal.conversationId }); } catch { /* invitation expires server-side */ }
          return;
        }
        updateCall({
          callId: signal.callId,
          conversationId: signal.conversationId,
          callerId: signal.fromUserId ?? "",
          phase: "incoming",
          callType: signal.callType === "VIDEO" ? "VIDEO" : "VOICE",
          members: [
            { userId: signal.fromUserId ?? "", username: signal.fromUsername ?? "Người dùng", joined: true },
            { userId, username, joined: false },
          ],
          muted: false,
          cameraOff: false,
          elapsedSeconds: 0,
        });
        return;
      }
      if (!current || signal.callId !== current.callId) return;
      if (signal.targetUserId && signal.targetUserId !== userId) return;

      if (["CANCELLED", "ENDED", "DISCONNECTED"].includes(signal.type)) {
        closeMedia();
        updateCall({ ...current, phase: "error", message: signal.type === "CANCELLED" ? "Cuộc gọi đã bị hủy." : "Cuộc gọi đã kết thúc." });
        return;
      }
      if (signal.type === "ERROR") {
        if (signal.message?.includes("đủ 4 người")) {
          closeMedia();
          updateCall({ ...current, phase: "error", message: signal.message });
        } else {
          updateCall({ ...current, phase: "error", message: signal.message ?? "Yêu cầu cuộc gọi không thành công." });
        }
        return;
      }
      if (["REJECTED", "MISSED"].includes(signal.type)) {
        const members = current.members.filter((member) => member.userId !== signal.fromUserId);
        updateCall({ ...current, members });
        if (signal.type === "MISSED") toast.info(`${members.length < current.members.length ? "Một thành viên không trả lời." : ""}`);
        return;
      }
      if (signal.type === "LEFT") {
        const peerId = signal.fromUserId ?? "";
        peerConnectionsRef.current.get(peerId)?.close();
        peerConnectionsRef.current.delete(peerId);
        pendingCandidatesRef.current.delete(peerId);
        updateCall({ ...current, members: current.members.filter((member) => member.userId !== peerId) });
        return;
      }

      void (async () => {
        try {
          if (signal.type === "JOINED") {
            const peerId = signal.fromUserId ?? "";
            if (!peerId || peerId === userId) return;
            const peerName = signal.fromUsername ?? "Người dùng";
            const latest = callRef.current;
            if (!latest) return;
            if (!latest.members.some((member) => member.userId === peerId)) {
              updateCall({ ...latest, members: [...latest.members, { userId: peerId, username: peerName, joined: true }] });
            }
            const connection = await ensurePeerConnection(peerId, peerName, latest);
            if (userId.localeCompare(peerId) < 0 && !offeredPeersRef.current.has(peerId)) {
              offeredPeersRef.current.add(peerId);
              const offer = await connection.createOffer();
              await connection.setLocalDescription(offer);
              publish({ type: "OFFER", callId: latest.callId, conversationId: latest.conversationId,
                targetUserId: peerId, sdp: offer.sdp });
            }
          } else if (signal.type === "OFFER") {
            const peerId = signal.fromUserId ?? "";
            if (!peerId || !signal.sdp) return;
            const connection = await ensurePeerConnection(peerId, signal.fromUsername ?? "Người dùng", current);
            await connection.setRemoteDescription({ type: "offer", sdp: signal.sdp });
            await applyPendingCandidates(peerId, connection);
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            publish({ type: "ANSWER", callId: current.callId, conversationId: current.conversationId,
              targetUserId: peerId, sdp: answer.sdp });
          } else if (signal.type === "ANSWER") {
            const peerId = signal.fromUserId ?? "";
            const connection = peerConnectionsRef.current.get(peerId);
            if (!connection || !signal.sdp) return;
            await connection.setRemoteDescription({ type: "answer", sdp: signal.sdp });
            await applyPendingCandidates(peerId, connection);
          } else if (signal.type === "ICE" && signal.candidate) {
            const peerId = signal.fromUserId ?? "";
            const candidate: RTCIceCandidateInit = { candidate: signal.candidate, sdpMid: signal.sdpMid,
              sdpMLineIndex: signal.sdpMLineIndex };
            const connection = peerConnectionsRef.current.get(peerId);
            if (connection?.remoteDescription) await connection.addIceCandidate(candidate);
            else pendingCandidatesRef.current.set(peerId, [...(pendingCandidatesRef.current.get(peerId) ?? []), candidate]);
          }
        } catch (error) {
          const latest = callRef.current;
          if (!latest || latest.callId !== current.callId) return;
          const peerId = signal.fromUserId;
          if (peerId) {
            peerConnectionsRef.current.get(peerId)?.close();
            peerConnectionsRef.current.delete(peerId);
          }
          const messageText = error instanceof Error ? error.message : "Không thể thiết lập cuộc gọi.";
          toast.error(messageText);
        }
      })();
    });
    return () => subscription.unsubscribe();
  }, [applyPendingCandidates, closeMedia, ensurePeerConnection, publish, stompClient, updateCall, userId, username]);

  useEffect(() => {
    if (!call || call.phase !== "active") return;
    const timer = window.setInterval(() => {
      const latest = callRef.current;
      if (latest?.callId === call.callId) updateCall({ ...latest, elapsedSeconds: latest.elapsedSeconds + 1 });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [call?.callId, call?.phase, updateCall]);

  useEffect(() => () => closeMedia(), [closeMedia]);

  const minutes = Math.floor((call?.elapsedSeconds ?? 0) / 60).toString().padStart(2, "0");
  const seconds = (call?.elapsedSeconds ?? 0) % 60;
  const joinedMembers = call?.members.filter((member) => member.joined) ?? [];

  return (
    <GroupCallContext.Provider value={{ startGroupCall }}>
      {children}
      {call && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="group-call-title">
          {call.phase === "active" || call.phase === "connecting" ? (
            <section className="relative flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 text-white">
              <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div>
                  <h2 id="group-call-title" className="font-semibold">Cuộc gọi nhóm</h2>
                  <p className="text-xs text-neutral-300">{call.phase === "connecting" ? "Đang kết nối..." : `${minutes}:${seconds.toString().padStart(2, "0")}`} · {joinedMembers.length}/4 người</p>
                </div>
                <Button variant="destructive" size="icon" onClick={leaveCall} aria-label="Rời cuộc gọi" title="Rời cuộc gọi"><PhoneOff /></Button>
              </header>
              <div className={`grid flex-1 gap-3 overflow-auto p-4 ${call.callType === "VIDEO" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
                {joinedMembers.map((member) => {
                  const isLocal = member.userId === userId;
                  const stream = isLocal ? localStream ?? undefined : member.stream;
                  return (
                    <article key={member.userId} className="relative flex min-h-40 aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-900">
                      {call.callType === "VIDEO" && stream && !(isLocal && call.cameraOff) ? <MediaVideo stream={stream} muted={isLocal} /> : <Avatar className="size-20"><AvatarFallback className="bg-neutral-700 text-xl text-white">{member.username.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>}
                      {!isLocal && <RemoteAudio stream={stream} />}
                      {isLocal && call.cameraOff && <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">Camera đã tắt</span>}
                      <span className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs">{isLocal ? "Bạn" : member.username}</span>
                    </article>
                  );
                })}
              </div>
              <footer className="flex items-center justify-center gap-3 border-t border-white/10 p-4">
                <Button variant="outline" size="icon" onClick={toggleMute} aria-label={call.muted ? "Bật micro" : "Tắt micro"} title={call.muted ? "Bật micro" : "Tắt micro"}>{call.muted ? <MicOff /> : <Mic />}</Button>
                {call.callType === "VIDEO" && <Button variant="outline" size="icon" onClick={toggleCamera} aria-label={call.cameraOff ? "Bật camera" : "Tắt camera"} title={call.cameraOff ? "Bật camera" : "Tắt camera"}>{call.cameraOff ? <VideoOff /> : <Video />}</Button>}
                <Button variant="destructive" size="icon" onClick={leaveCall} aria-label="Rời cuộc gọi" title="Rời cuộc gọi"><PhoneOff /></Button>
              </footer>
            </section>
          ) : (
            <section className="w-full max-w-sm rounded-xl bg-white p-6 text-center text-neutral-900 shadow-2xl">
              <Avatar className="mx-auto mb-4 size-20"><AvatarFallback className="bg-emerald-100 text-xl text-emerald-800">{call.members[0]?.username.slice(0, 2).toUpperCase() ?? "NH"}</AvatarFallback></Avatar>
              <h2 id="group-call-title" className="text-xl font-semibold">{call.phase === "error" ? "Cuộc gọi nhóm" : call.members[0]?.username ?? "Cuộc gọi nhóm"}</h2>
              <p className="mt-2 text-sm text-neutral-600">
                {call.phase === "incoming" ? `Lời mời gọi ${call.callType === "VIDEO" ? "video" : "thoại"} nhóm` : call.phase === "outgoing" ? "Đang mời thành viên tham gia..." : call.message}
              </p>
              {call.phase === "error" && <p role="alert" className="mt-3 text-sm text-rose-700">{call.message}</p>}
              <div className="mt-6 flex justify-center gap-3">
                {call.phase === "incoming" && <>
                  <Button variant="destructive" size="icon" onClick={rejectCall} aria-label="Từ chối cuộc gọi"><PhoneOff /></Button>
                  <Button size="icon" onClick={() => void acceptCall()} aria-label="Nhận cuộc gọi">{call.callType === "VIDEO" ? <Video /> : <Mic />}</Button>
                </>}
                {call.phase === "outgoing" && <Button variant="destructive" size="icon" onClick={leaveCall} aria-label="Hủy cuộc gọi"><PhoneOff /></Button>}
                {call.phase === "error" && <Button variant="outline" onClick={dismissCall}>Đóng</Button>}
              </div>
            </section>
          )}
        </div>
      )}
    </GroupCallContext.Provider>
  );
}
