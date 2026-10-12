package com.nekotalk.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nekotalk.dto.request.CreateConversationRequest;
import com.nekotalk.dto.response.ApiResponse;
import com.nekotalk.dto.response.ConversationDetailResponse;
import com.nekotalk.dto.response.CreateConversationResponse;
import com.nekotalk.dto.response.PageResponse;
import com.nekotalk.service.ConversationService;

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
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

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

}
