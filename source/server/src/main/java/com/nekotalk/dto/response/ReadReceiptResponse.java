package com.nekotalk.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record ReadReceiptResponse(
    String conversationId,
    String readerId,
    String readerName,
    LocalDateTime readAt
) {

}
