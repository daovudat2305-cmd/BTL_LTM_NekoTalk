package com.nekotalk.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nekotalk.dto.request.CreateUserRequest;
import com.nekotalk.dto.response.ApiResponse;
import com.nekotalk.dto.response.AvatarUploadResponse;
import com.nekotalk.dto.response.CreateUserResponse;
import com.nekotalk.dto.response.PageResponse;
import com.nekotalk.dto.response.UserDetailResponse;
import com.nekotalk.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ApiResponse<CreateUserResponse> createUser(@RequestBody @Valid CreateUserRequest request) {
        var data = userService.createUser(request);

        return ApiResponse.<CreateUserResponse>builder()
                .code(HttpStatus.OK.value())
                .message("User created successfully")
                .data(data)
                .build();
    }

    // API lấy hồ sơ của tài khoản đang đăng nhập từ JWT access token.
    @GetMapping("/my-info")
    public ApiResponse<UserDetailResponse> getMyInfo(@AuthenticationPrincipal Jwt jwt) {
        var userId = jwt.getSubject();

        var data = userService.getMyInfo(userId);

        return ApiResponse.<UserDetailResponse>builder()
                .code(HttpStatus.OK.value())
                .message("User info retrieved successfully")
                .data(data)
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<PageResponse<UserDetailResponse>> searchUsers(
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "5") int size,
            @RequestParam(required = false) String keyword) {
        var data = userService.searchUsers(keyword, page, size);

        return ApiResponse.<PageResponse<UserDetailResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Users retrieved successfully")
                .data(data)
                .build();
    }

    @PostMapping("/avatar")
    public ApiResponse<AvatarUploadResponse> updateAvatar(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam("file") MultipartFile file
    ) {
        var userId = jwt.getSubject();
        var data = userService.updateAvatar(userId, file);

        return ApiResponse.<AvatarUploadResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Cập nhật ảnh đại diện thành công")
            .data(data)
            .build();
    }

}
