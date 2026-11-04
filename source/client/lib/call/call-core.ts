export const ICE_CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export async function getLocalMediaStream(callType: "VOICE" | "VIDEO") {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Trình duyệt cần HTTPS hoặc localhost để truy cập camera và micro.");
  }

  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: callType === "VIDEO",
  });
}

export function attachLocalStreamToPeer(peerConnection: RTCPeerConnection, stream: MediaStream) {
  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
}

export function stopMediaStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function isPermissionIssue(message: string) {
  return message.includes("Permission") || message.includes("denied") || message.includes("permission");
}
