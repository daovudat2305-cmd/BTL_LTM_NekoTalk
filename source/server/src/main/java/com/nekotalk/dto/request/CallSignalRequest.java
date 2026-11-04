package com.nekotalk.dto.request;

public record CallSignalRequest(
        String type,
        String callId,
        String conversationId,
        String targetUserId,
        String callType,
        String sdp,
        String candidate,
        String sdpMid,
        Integer sdpMLineIndex,
        Boolean groupCall) {
}