export type CallSignalType =
  | "INVITE"
  | "ACCEPT"
  | "REJECT"
  | "CANCEL"
  | "OFFER"
  | "ANSWER"
  | "ICE"
  | "HANGUP"
  | "MISSED"
  | "ENDED"
  | "CANCELLED"
  | "REJECTED"
  | "DISCONNECTED"
  | "ERROR";

export interface CallSignal {
  type: CallSignalType;
  callId: string;
  conversationId: string;
  targetUserId?: string;
  callType?: "VOICE" | "VIDEO";
  fromUserId?: string;
  fromUsername?: string;
  sdp?: string;
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  message?: string;
}