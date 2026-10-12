package com.nekotalk.event;

import java.util.List;

import com.nekotalk.dto.response.ChatMessageResponse;

public record ChatMessageCreatedEvent(
    ChatMessageResponse response,
    List<String> recipientIds
) {
}
