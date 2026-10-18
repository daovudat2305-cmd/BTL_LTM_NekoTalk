package com.nekotalk.dto.response;

import lombok.Builder;

@Builder
public record AvatarUploadResponse(
    String avatarUrl
) {}
