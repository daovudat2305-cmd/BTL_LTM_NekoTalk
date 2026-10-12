package com.nekotalk.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nekotalk.dto.request.ChatMessageRequest;
import com.nekotalk.dto.response.ApiResponse;
import com.nekotalk.dto.response.ChatMessageResponse;
import com.nekotalk.dto.response.PageResponse;
import com.nekotalk.service.ChatMessageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/chat-messages")
@RequiredArgsConstructor
public class ChatMessageController {
    private final ChatMessageService chatMessageService;

    @PostMapping
    public ApiResponse<ChatMessageResponse> sendChatMessage(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid ChatMessageRequest request) {
        var senderId = jwt.getSubject();
        var data = chatMessageService.sendChatMessage(senderId, request);
        return ApiResponse.<ChatMessageResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Chat message sent successfully")
                .data(data)
                .build();
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<PageResponse<ChatMessageResponse>> getMessage(
            @PathVariable String conversationId,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        var data = chatMessageService.getMessagesByConversationId(conversationId, page, size);

        return ApiResponse.<PageResponse<ChatMessageResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Message retrieved successfully")
                .data(data)
                .build();
    }

}
