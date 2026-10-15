package com.nekotalk.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class LogoutRequest {
    @NotBlank(message= "Refresh token is required")
    private String refreshToken;
}
