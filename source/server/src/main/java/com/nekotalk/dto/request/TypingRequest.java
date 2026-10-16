package com.nekotalk.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record TypingRequest(
    @NotBlank(message = "Conversation ID is required")
    String conversationId,
    boolean isTyping
) {

}
