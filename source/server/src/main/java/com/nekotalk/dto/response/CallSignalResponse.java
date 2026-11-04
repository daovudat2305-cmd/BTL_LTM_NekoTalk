package com.nekotalk.dto.response;

import lombok.Builder;

@Builder
public record CallSignalResponse(
        String type,
        String callId,
        String conversationId,
        String fromUserId,
        String fromUsername,
        String targetUserId,
        boolean groupCall,
        String callType,
        String sdp,
        String candidate,
        String sdpMid,
        Integer sdpMLineIndex,
        String message) {
}