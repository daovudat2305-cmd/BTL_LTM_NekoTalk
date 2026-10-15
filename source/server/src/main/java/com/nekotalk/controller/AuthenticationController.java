package com.nekotalk.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nekotalk.dto.request.LoginRequest;
import com.nekotalk.dto.request.LogoutRequest;
import com.nekotalk.dto.request.RefreshTokenRequest;
import com.nekotalk.dto.response.ApiResponse;
import com.nekotalk.dto.response.LoginResponse;
import com.nekotalk.service.AuthenticationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        var data = authenticationService.login(request);
        return ApiResponse.<LoginResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Login successfully")
                .data(data)
                .build();
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refreshToken(@RequestBody @Valid RefreshTokenRequest request) {
        var data = authenticationService.refreshToken(request);
        
        return ApiResponse.<LoginResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Refresh token successfully")
                .data(data)
                .build();
    }
    // Logout cần access token hợp lệ và refresh token cần thu hồi.
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid LogoutRequest request) {
        authenticationService.logout(jwt.getSubject(), request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }
    
}
