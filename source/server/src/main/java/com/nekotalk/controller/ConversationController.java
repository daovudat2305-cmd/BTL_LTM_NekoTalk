package com.nekotalk.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nekotalk.dto.request.CreateConversationRequest;
import com.nekotalk.dto.response.ApiResponse;
import com.nekotalk.dto.response.AvatarUploadResponse;
import com.nekotalk.dto.response.ConversationDetailResponse;
import com.nekotalk.dto.response.CreateConversationResponse;
import com.nekotalk.dto.response.PageResponse;
import com.nekotalk.service.CloudinaryService;
import com.nekotalk.service.ConversationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final CloudinaryService cloudinaryService;

    @PostMapping("/avatar")
    public ApiResponse<AvatarUploadResponse> uploadGroupAvatar(@RequestParam("file") MultipartFile file) {
        String avatarUrl = cloudinaryService.uploadAvatar(file);

        return ApiResponse.<AvatarUploadResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Group avatar uploaded successfully")
                .data(AvatarUploadResponse.builder().avatarUrl(avatarUrl).build())
                .build();
    }

    @PostMapping
    public ApiResponse<CreateConversationResponse> createConversation(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid CreateConversationRequest request) {
        var creatorId = jwt.getSubject();

        var data = conversationService.createConversation(creatorId, request);
        return ApiResponse.<CreateConversationResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Conversation created successfully")
                .data(data)
                .build();
    }

    @GetMapping("/my-conversation")
    public ApiResponse<PageResponse<ConversationDetailResponse>> getMyConversation(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int size) {
        var userId = jwt.getSubject();
        var data = conversationService.getMyConversation(userId, page, size);

        return ApiResponse.<PageResponse<ConversationDetailResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("My conversation retrieved successfully")
                .data(data)
                .build();
    }

    @PatchMapping("/{conversationId}/read")
    public ApiResponse<Void> markAsRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String conversationId) {
        String userId = jwt.getSubject();
        conversationService.markConversationAsRead(userId, conversationId);

        return ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Marked conversation as read")
                .build();
    }

}
