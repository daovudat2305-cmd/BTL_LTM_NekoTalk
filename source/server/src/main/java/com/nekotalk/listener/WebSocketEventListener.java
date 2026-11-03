package com.nekotalk.listener;

import java.security.Principal;
import java.time.LocalDateTime;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.nekotalk.dto.response.PresenceResponse;
import com.nekotalk.service.CallService;
import com.nekotalk.service.UserPresenceService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "WEBSOCKET-EVENT-LISTENER")
public class WebSocketEventListener {

    private final UserPresenceService presenceService;
    private final CallService callService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();

        if (principal != null) {
            String userId = principal.getName();
            String sessionId = accessor.getSessionId();

            boolean justBecameOnline = presenceService.addSession(userId, sessionId);
            if (justBecameOnline) {
                log.info("Broadcast User Online: {}", userId);
                PresenceResponse response = PresenceResponse.builder()
                        .userId(userId)
                        .isOnline(true)
                        .lastOnlineAt(null)
                        .build();

                // Broadcast trạng thái tới tất cả client đang theo dõi topic presence
                messagingTemplate.convertAndSend("/topic/presence", response);
            }
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        String sessionId = event.getSessionId();

        if (principal != null) {
            String userId = principal.getName();
            callService.handleDisconnect(userId, sessionId);

            boolean justBecameOffline = presenceService.removeSession(userId, sessionId);
            if (justBecameOffline) {
                LocalDateTime lastOnline = presenceService.getLastActiveAt(userId);
                log.info("Broadcast User Offline: {}, lastOnline: {}", userId, lastOnline);

                PresenceResponse response = PresenceResponse.builder()
                        .userId(userId)
                        .isOnline(false)
                        .lastOnlineAt(lastOnline)
                        .build();

                messagingTemplate.convertAndSend("/topic/presence", response);
            }
        }
    }
}
