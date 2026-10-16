package com.nekotalk.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.nekotalk.dto.request.TypingRequest;
import com.nekotalk.dto.response.TypingResponse;
import com.nekotalk.entity.User;
import com.nekotalk.repository.ConversationRepository;
import com.nekotalk.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class TypingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    @MessageMapping("/chat.typing")
    public void handleTypingEvent(@Payload TypingRequest request, Principal principal) {
        if(principal == null) {
            log.warn("Typing event rejected: Unauthorized");
            return;
        }

        String senderId = principal.getName();
        String conversationId = request.conversationId();

        //1. lấy thông tin người gửi
        User sender = userRepository.findById(senderId).orElse(null);
        String senderUsername = (sender != null) ? sender.getUsername() : "Ai đó";

        //2. tìm danh sách người nhận trong conversation
        List<String> recipientIds = conversationRepository.findParticipantIdsByConversationIdAndSenderId(conversationId, senderId);

        //3. đóng gói request
        TypingResponse response = TypingResponse.builder()
            .conversationId(conversationId)
            .userId(senderId)
            .username(senderUsername)
            .isTyping(request.isTyping())
            .build();

        log.info("Typing event: user [{}] isTyping={} in conv [{}], sending to {} recipients",
            senderUsername, request.isTyping(), conversationId, recipientIds.size());

        //4. gửi sự kiện
        for(String recipientId : recipientIds) {
            try {
                messagingTemplate.convertAndSendToUser(recipientId, "/queue/typing", response);
            } catch (Exception e) {
                log.error("Failed to forward typing event to user {}: {}", recipientId, e.getMessage());
            }
        }
    }

}
