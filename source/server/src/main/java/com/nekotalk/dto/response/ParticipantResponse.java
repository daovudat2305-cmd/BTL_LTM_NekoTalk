package com.nekotalk.dto.response;

import lombok.Builder;

@Builder
public record ParticipantResponse(
        String userId,
        String username) {
}