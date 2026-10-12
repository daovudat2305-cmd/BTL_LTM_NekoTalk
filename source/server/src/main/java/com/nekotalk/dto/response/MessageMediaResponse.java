package com.nekotalk.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record MessageMediaResponse(
                String fileName,
                String fileType,
                String thumbnailUrl,
                LocalDateTime uploadedAt) {

}
