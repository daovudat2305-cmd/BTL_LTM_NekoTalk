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
import { AlertCircle, Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/useChatStore";
import type { CallSignal } from "@/types";

type CallPhase = "incoming" | "outgoing" | "connecting" | "active" | "error";

interface VoiceCallState {
  callId: string;
  conversationId: string;
  peerUserId: string;
  peerName: string;
  phase: CallPhase;
  callType: "VOICE" | "VIDEO";
  muted: boolean;
  cameraOff: boolean;
  elapsedSeconds: number;
  message?: string;
}

interface VoiceCallContextValue {
  startVoiceCall: (conversationId: string, peerUserId: string, peerName: string) => void;
  startVideoCall: (conversationId: string, peerUserId: string, peerName: string) => void;
}

const VoiceCallContext = createContext<VoiceCallContextValue | null>(null);

const ICE_CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useVoiceCall() {
  const context = useContext(VoiceCallContext);
  if (!context) {
    throw new Error("useVoiceCall must be used within VoiceCallProvider");
  }
  return context;
}

export default function VoiceCallProvider({ children }: { children: ReactNode }) {
  const stompClient = useChatStore((state) => state.stompClient);
  const [call, setCall] = useState<VoiceCallState | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callRef = useRef<VoiceCallState | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const activeCallId = call?.callId;
  const activeCallPhase = call?.phase;

  const updateCall = useCallback((next: VoiceCallState | null) => {
    callRef.current = next;
    setCall(next);
  }, []);

  const publish = useCallback(
    (signal: CallSignal) => {
      if (!stompClient?.connected) {
        throw new Error("Mất kết nối máy chủ. Hãy thử gọi lại.");
      }
      stompClient.publish({
        destination: "/app/call.signal",
        body: JSON.stringify(signal),
      });
    },
    [stompClient],
  );

  const closeMedia = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    pendingCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const dismissCall = useCallback(() => {
    closeMedia();
    updateCall(null);
  }, [closeMedia, updateCall]);

  const signalCurrentCall = useCallback(
    (type: CallSignal["type"]) => {
      const current = callRef.current;
      if (!current) return;
      publish({
        type,
        callId: current.callId,
        conversationId: current.conversationId,
        callType: current.callType,
      });
    },
    [publish],
  );

  const makePeerConnection = useCallback(
    async (current: VoiceCallState) => {
      if (peerConnectionRef.current) return peerConnectionRef.current;

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: current.callType === "VIDEO",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const peerConnection = new RTCPeerConnection(ICE_CONFIGURATION);
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.ontrack = (event) => {
        const [incomingStream] = event.streams;
        if (incomingStream) setRemoteStream(incomingStream);
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && event.candidate.candidate) {
          try {
            publish({
              type: "ICE",
              callId: current.callId,
              conversationId: current.conversationId,
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            });
          } catch {
            toast.error("Không thể gửi thông tin kết nối cuộc gọi.");
          }
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          const latest = callRef.current;
          if (latest?.callId === current.callId) {
            updateCall({ ...latest, phase: "active", message: undefined });
          }
        } else if (peerConnection.connectionState === "failed") {
          const latest = callRef.current;
          if (latest?.callId === current.callId) {
            try {
              publish({
                type: "HANGUP",
                callId: current.callId,
                conversationId: current.conversationId,
              });
            } catch {
              // The peer connection is already unavailable.
            }
            updateCall({ ...latest, phase: "error", message: "Không thể thiết lập kết nối. Hãy thử lại." });
            closeMedia();
          }
        }
      };

      return peerConnection;
    },
    [closeMedia, publish, updateCall],
  );

  const applyPendingCandidates = useCallback(async (peerConnection: RTCPeerConnection) => {
    const candidates = pendingCandidatesRef.current.splice(0);
    for (const candidate of candidates) {
      await peerConnection.addIceCandidate(candidate);
    }
  }, []);

  const initiateCall = useCallback(
    (conversationId: string, peerUserId: string, peerName: string, callType: "VOICE" | "VIDEO") => {
      if (callRef.current) {
        toast.error("Bạn đang có một cuộc gọi khác.");
        return;
      }
      if (!stompClient?.connected) {
        toast.error("Đang kết nối máy chủ. Vui lòng thử lại sau.");
        return;
      }

      const nextCall: VoiceCallState = {
        callId: crypto.randomUUID(),
        conversationId,
        peerUserId,
        peerName,
        phase: "outgoing",
        callType,
        muted: false,
        cameraOff: false,
        elapsedSeconds: 0,
      };
      updateCall(nextCall);

      try {
        publish({
          type: "INVITE",
          callId: nextCall.callId,
          conversationId,
          targetUserId: peerUserId,
          callType,
        });
      } catch (error) {
        updateCall({
          ...nextCall,
          phase: "error",
          message: error instanceof Error ? error.message : "Không thể bắt đầu cuộc gọi.",
        });
      }
    },
    [publish, stompClient, updateCall],
  );

  const startVoiceCall = useCallback(
    (conversationId: string, peerUserId: string, peerName: string) => {
      initiateCall(conversationId, peerUserId, peerName, "VOICE");
    },
    [initiateCall],
  );

  const startVideoCall = useCallback(
    (conversationId: string, peerUserId: string, peerName: string) => {
      initiateCall(conversationId, peerUserId, peerName, "VIDEO");
    },
    [initiateCall],
  );

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (!current || current.phase !== "incoming") return;
    try {
      await makePeerConnection(current);
      publish({
        type: "ACCEPT",
        callId: current.callId,
        conversationId: current.conversationId,
        callType: current.callType,
      });
      updateCall({ ...current, phase: "connecting", message: undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể truy cập micro/camera.";
      try {
        publish({ type: "REJECT", callId: current.callId, conversationId: current.conversationId });
      } catch {
        // The socket may have closed while requesting media permission.
      }
      closeMedia();
      updateCall({
        ...current,
        phase: "error",
        message: message.includes("Permission") || message.includes("denied")
          ? "Bạn chưa cấp quyền sử dụng micro hoặc máy ảnh."
          : "Không thể truy cập thiết bị nghe nhìn hoặc máy chủ đã ngắt kết nối.",
      });
    }
  }, [closeMedia, makePeerConnection, publish, updateCall]);

  const rejectCall = useCallback(() => {
    signalCurrentCall("REJECT");
    dismissCall();
  }, [dismissCall, signalCurrentCall]);

  const cancelOrHangup = useCallback(() => {
    const current = callRef.current;
    if (!current) return;
    try {
      signalCurrentCall(current.phase === "outgoing" ? "CANCEL" : "HANGUP");
    } catch {
      toast.error("Đã mất kết nối với máy chủ.");
    }
    dismissCall();
  }, [dismissCall, signalCurrentCall]);

  const toggleMute = useCallback(() => {
    const current = callRef.current;
    const stream = localStreamRef.current;
    if (!current || !stream) return;
    const muted = !current.muted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
    updateCall({ ...current, muted });
  }, [updateCall]);

  const toggleCamera = useCallback(() => {
    const current = callRef.current;
    const stream = localStreamRef.current;
    if (!current || !stream || current.callType !== "VIDEO") return;
    const cameraOff = !current.cameraOff;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !cameraOff;
    });
    updateCall({ ...current, cameraOff });
  }, [updateCall]);

  useEffect(() => {
    if (!stompClient?.connected) return;

    const subscription: StompSubscription = stompClient.subscribe(
      "/user/queue/calls",
      (message: IMessage) => {
        let signal: CallSignal;
        try {
          signal = JSON.parse(message.body) as CallSignal;
        } catch {
          toast.error("Nhận được tín hiệu cuộc gọi không hợp lệ.");
          return;
        }

        const current = callRef.current;
        if (signal.type === "INVITE") {
          if (current) {
            try {
              publish({
                type: "REJECT",
                callId: signal.callId,
                conversationId: signal.conversationId,
              });
            } catch {
              // The invitation expires on the server if it cannot be rejected.
            }
            return;
          }
          updateCall({
            callId: signal.callId,
            conversationId: signal.conversationId,
            peerUserId: signal.fromUserId || "",
            peerName: signal.fromUsername || "Người dùng",
            phase: "incoming",
            callType: signal.callType === "VIDEO" ? "VIDEO" : "VOICE",
            muted: false,
            cameraOff: false,
            elapsedSeconds: 0,
          });
          return;
        }

        if (!current || signal.callId !== current.callId) return;

        if (["REJECTED", "CANCELLED", "MISSED", "ENDED", "DISCONNECTED"].includes(signal.type)) {
          const statusMessages: Record<string, string> = {
            REJECTED: "Cuộc gọi đã bị từ chối.",
            CANCELLED: "Cuộc gọi đã bị hủy.",
            MISSED: "Không có người trả lời.",
            ENDED: "Cuộc gọi đã kết thúc.",
            DISCONNECTED: "Kết nối của người kia đã đóng.",
          };
          if (signal.type !== "ENDED") toast.info(statusMessages[signal.type]);
          closeMedia();
          updateCall({ ...current, phase: "error", message: statusMessages[signal.type] });
          return;
        }

        if (signal.type === "ERROR") {
          closeMedia();
          updateCall({ ...current, phase: "error", message: signal.message || "Yêu cầu cuộc gọi không thành công." });
          return;
        }

        void (async () => {
          try {
            if (signal.type === "ACCEPT" && current.phase === "outgoing") {
              updateCall({ ...current, phase: "connecting" });
              const peerConnection = await makePeerConnection(current);
              const offer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(offer);
              publish({
                type: "OFFER",
                callId: current.callId,
                conversationId: current.conversationId,
                callType: current.callType,
                sdp: offer.sdp,
              });
            } else if (signal.type === "OFFER" && current.phase === "connecting") {
              const peerConnection = peerConnectionRef.current;
              if (!peerConnection || !signal.sdp) return;
              await peerConnection.setRemoteDescription({ type: "offer", sdp: signal.sdp });
              await applyPendingCandidates(peerConnection);
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);
              publish({
                type: "ANSWER",
                callId: current.callId,
                conversationId: current.conversationId,
                callType: current.callType,
                sdp: answer.sdp,
              });
            } else if (signal.type === "ANSWER" && current.phase === "connecting") {
              const peerConnection = peerConnectionRef.current;
              if (!peerConnection || !signal.sdp) return;
              await peerConnection.setRemoteDescription({ type: "answer", sdp: signal.sdp });
              await applyPendingCandidates(peerConnection);
            } else if (signal.type === "ICE" && signal.candidate) {
              const candidate: RTCIceCandidateInit = {
                candidate: signal.candidate,
                sdpMid: signal.sdpMid,
                sdpMLineIndex: signal.sdpMLineIndex,
              };
              const peerConnection = peerConnectionRef.current;
              if (peerConnection?.remoteDescription) {
                await peerConnection.addIceCandidate(candidate);
              } else {
                pendingCandidatesRef.current.push(candidate);
              }
            }
          } catch (error) {
            const latest = callRef.current;
            if (latest?.callId !== current.callId) return;
            try {
              publish({ type: "HANGUP", callId: current.callId, conversationId: current.conversationId });
            } catch {
              // The call is already unusable.
            }
            closeMedia();
            updateCall({
              ...latest,
              phase: "error",
              message: error instanceof Error ? error.message : "Không thể thiết lập cuộc gọi.",
            });
          }
        })();
      },
    );

    return () => subscription.unsubscribe();
  }, [applyPendingCandidates, closeMedia, makePeerConnection, publish, stompClient, updateCall]);

  useEffect(() => {
    if (!activeCallId || activeCallPhase !== "active") return;
    const timer = window.setInterval(() => {
      const latest = callRef.current;
      if (latest?.callId === activeCallId) {
        updateCall({ ...latest, elapsedSeconds: latest.elapsedSeconds + 1 });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeCallId, activeCallPhase, updateCall]);

  // Audio output
  useEffect(() => {
    if (!remoteAudioRef.current) return;
    remoteAudioRef.current.srcObject = remoteStream;
    if (remoteStream) {
      void remoteAudioRef.current.play().catch(() => {
        toast.info("Cho phép phát âm thanh trong trình duyệt để nghe cuộc gọi.");
      });
    }
  }, [remoteStream]);

  // Video outputs
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => () => closeMedia(), [closeMedia]);

  const minutes = Math.floor((call?.elapsedSeconds || 0) / 60).toString().padStart(2, "0");
  const seconds = ((call?.elapsedSeconds || 0) % 60).toString().padStart(2, "0");
  const initials = (call?.peerName || "?").slice(0, 2).toUpperCase();

  return (
    <VoiceCallContext.Provider value={{ startVoiceCall, startVideoCall }}>
      {children}
      <audio ref={remoteAudioRef} autoPlay />

      {call && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-modal-title"
        >
          {call.callType === "VIDEO" && (call.phase === "active" || call.phase === "connecting") ? (
            /* Video Active/Connecting Modal */
            <section className="relative flex flex-col w-full max-w-4xl h-[85vh] overflow-hidden rounded-2xl bg-neutral-950 shadow-2xl border border-neutral-800">
              {/* Header Info */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-3 rounded-full bg-black/40 backdrop-blur-md px-4 py-2 border border-white/10 text-white">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span id="call-modal-title" className="text-sm font-semibold">{call.peerName}</span>
                <span className="text-xs text-neutral-300">
                  {call.phase === "connecting" ? "Đang kết nối..." : `${minutes}:${seconds}`}
                </span>
              </div>

              {/* Main Remote Video */}
              <div className="relative flex-1 w-full h-full bg-neutral-900 flex items-center justify-center overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-900 text-neutral-400">
                    <Avatar className="size-24 border-4 border-neutral-800">
                      <AvatarFallback className="bg-neutral-800 text-2xl font-bold text-neutral-200">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm">Đang tải video của {call.peerName}...</p>
                  </div>
                )}
              </div>

              {/* Local Video Pip (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 z-20 w-32 sm:w-48 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-neutral-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${call.cameraOff ? "hidden" : "block"}`}
                />
                {call.cameraOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-400 text-xs">
                    <VideoOff size={20} className="mb-1 text-neutral-400" />
                    <span>Đã tắt camera</span>
                  </div>
                )}
              </div>

              {/* Control Action Bar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 sm:gap-4 rounded-full bg-black/60 backdrop-blur-md px-5 py-3 border border-white/10 shadow-lg">
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  className={`size-12 rounded-full border-none transition ${
                    call.muted
                      ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                  aria-label={call.muted ? "Bật micro" : "Tắt micro"}
                  title={call.muted ? "Bật micro" : "Tắt micro"}
                >
                  {call.muted ? <MicOff size={20} /> : <Mic size={20} />}
                </Button>

                <Button
                  onClick={toggleCamera}
                  variant="outline"
                  className={`size-12 rounded-full border-none transition ${
                    call.cameraOff
                      ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                  aria-label={call.cameraOff ? "Bật camera" : "Tắt camera"}
                  title={call.cameraOff ? "Bật camera" : "Tắt camera"}
                >
                  {call.cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </Button>

                <Button
                  onClick={cancelOrHangup}
                  variant="destructive"
                  className="size-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30"
                  aria-label="Kết thúc cuộc gọi"
                  title="Kết thúc cuộc gọi"
                >
                  <PhoneOff size={22} />
                </Button>
              </div>
            </section>
          ) : (
            /* Standard Modal (Voice Call hoặc Video Call khi Incoming/Outgoing/Error) */
            <section className="w-full max-w-sm overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-100 dark:border-neutral-800">
              <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
                <div className="relative mb-4">
                  <Avatar className="size-20 border-4 border-emerald-100 dark:border-emerald-950">
                    <AvatarFallback className="bg-emerald-50 text-xl font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {call.callType === "VIDEO" && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-indigo-600 p-1.5 text-white shadow">
                      <Video size={14} />
                    </div>
                  )}
                </div>

                <h2 id="call-modal-title" className="max-w-full break-words text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {call.peerName}
                </h2>

                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {call.phase === "incoming" &&
                    (call.callType === "VIDEO" ? "Cuộc gọi video đến..." : "Cuộc gọi thoại đến...")}
                  {call.phase === "outgoing" &&
                    (call.callType === "VIDEO" ? "Đang gọi video..." : "Đang gọi...")}
                  {call.phase === "connecting" && "Đang kết nối..."}
                  {call.phase === "active" && `${minutes}:${seconds}`}
                  {call.phase === "error" && (call.message || "Cuộc gọi không thành công.")}
                </p>

                {call.phase === "error" && (
                  <div className="mt-4 flex items-center gap-2 text-left text-sm text-amber-800 dark:text-amber-400" role="status">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{call.message}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 px-6 py-5">
                {call.phase === "incoming" ? (
                  <>
                    <Button
                      onClick={rejectCall}
                      variant="destructive"
                      className="size-12 rounded-full"
                      aria-label="Từ chối cuộc gọi"
                      title="Từ chối"
                    >
                      <PhoneOff aria-hidden="true" />
                    </Button>
                    <Button
                      onClick={() => void acceptCall()}
                      className="size-12 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/30"
                      aria-label="Nhận cuộc gọi"
                      title="Nhận cuộc gọi"
                    >
                      {call.callType === "VIDEO" ? <Video aria-hidden="true" /> : <Phone aria-hidden="true" />}
                    </Button>
                  </>
                ) : call.phase === "active" ? (
                  <>
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      className="size-12 rounded-full"
                      aria-label={call.muted ? "Bật micro" : "Tắt micro"}
                      title={call.muted ? "Bật micro" : "Tắt micro"}
                    >
                      {call.muted ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
                    </Button>
                    <Button
                      onClick={cancelOrHangup}
                      variant="destructive"
                      className="size-12 rounded-full"
                      aria-label="Kết thúc cuộc gọi"
                      title="Kết thúc cuộc gọi"
                    >
                      <PhoneOff aria-hidden="true" />
                    </Button>
                  </>
                ) : call.phase === "error" ? (
                  <Button onClick={dismissCall} variant="outline">
                    Đóng
                  </Button>
                ) : (
                  <Button
                    onClick={cancelOrHangup}
                    variant="destructive"
                    className="size-12 rounded-full"
                    aria-label={call.phase === "outgoing" ? "Hủy cuộc gọi" : "Kết thúc cuộc gọi"}
                    title={call.phase === "outgoing" ? "Hủy cuộc gọi" : "Kết thúc cuộc gọi"}
                  >
                    <PhoneOff aria-hidden="true" />
                  </Button>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </VoiceCallContext.Provider>
  );
}