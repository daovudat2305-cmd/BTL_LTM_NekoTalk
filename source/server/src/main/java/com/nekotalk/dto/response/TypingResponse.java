package com.nekotalk.dto.response;

import lombok.Builder;

@Builder
public record TypingResponse(
    String conversationId,
    String userId,
    String username,
    boolean isTyping
) {

}
