package com.nekotalk.listener;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.nekotalk.event.ChatMessageCreatedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component 
@Slf4j 
@RequiredArgsConstructor 
public class ChatMessageBroadcastListener {
    private final SimpMessagingTemplate simpMessagingTemplate;

    @Async 
    @TransactionalEventListener (phase = TransactionPhase.AFTER_COMMIT)
    public void handleMessageBroadcast(ChatMessageCreatedEvent event) {
        for(String recipientId : event.recipientIds()) {
            try {
                simpMessagingTemplate.convertAndSendToUser(recipientId, "/queue/messages", event.response());
            } catch (Exception e) {
                log.error("Failed to push websocket message to user {}: {}", recipientId, e.getMessage());
            }
        }
    }
}
