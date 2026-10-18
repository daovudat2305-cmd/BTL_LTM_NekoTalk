package com.nekotalk.dto.response;

import lombok.Builder;

@Builder
public record UserDetailResponse(
        String userId,
        String email,
        String username,
        String avatarUrl
) {}