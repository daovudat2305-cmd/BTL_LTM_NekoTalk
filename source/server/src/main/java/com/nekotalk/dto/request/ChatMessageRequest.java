package com.nekotalk.dto.request;

import java.util.List;

import com.nekotalk.common.MessageType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ChatMessageRequest(
                String tempId, // temporary ID từ client để map với message đã gửi (optimistic UI)

                @NotBlank(message = "Conversation id is required") String conversationId,

                String content,

                @NotNull(message = "Message type is required") MessageType messageType,

                List<MessageMediaRequest> messageMedia) {

}
