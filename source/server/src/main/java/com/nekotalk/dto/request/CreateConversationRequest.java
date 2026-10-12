package com.nekotalk.dto.request;

import java.util.List;

import com.nekotalk.common.ConversationType;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record CreateConversationRequest(
        String name,
        String conversationAvatar,

        @NotNull(message = "Conversation type is required") ConversationType conversationType, // PRIVATE, GROUP

        @NotEmpty(message = "Participant ids are required") List<String> participantIds) {
}
