package com.nekotalk.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.nekotalk.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "USER-PRESENCE")
public class UserPresenceService {
    private final UserRepository userRepository;

    // Lưu ánh xạ userId -> danh sách các WebSocket sessionIds đang kết nối
    private final Map<String, Set<String>> userSessions = new ConcurrentHashMap<>();
    // Cache thời gian online gần nhất
    private final Map<String, LocalDateTime> lastActiveCache = new ConcurrentHashMap<>();

    /**
     * Ghi nhận một session mới được kết nối.
     * @return true nếu đây là session đầu tiên (chuyển từ Offline -> Online).
     */
    public boolean addSession(String userId, String sessionId) {
        Set<String> sessions = userSessions.computeIfAbsent(userId, k -> Collections.newSetFromMap(new ConcurrentHashMap<>()));
        boolean wasEmpty = sessions.isEmpty();
        sessions.add(sessionId);
        log.info("User {} connected session {}. Total sessions: {}", userId, sessionId, sessions.size());
        return wasEmpty;
    }
    
    /**
     * Ghi nhận một session bị ngắt kết nối.
     * @return true nếu user không còn session nào (chuyển từ Online -> Offline).
     */
    public boolean removeSession(String userId, String sessionId) {
        Set<String> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            log.info("User {} disconnected session {}. Remaining sessions: {}", userId, sessionId, sessions.size());
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
                LocalDateTime now = LocalDateTime.now();
                lastActiveCache.put(userId, now);
                try {
                    userRepository.updateLastActiveAt(userId, now);
                } catch (Exception e) {
                    log.error("Failed to update lastActiveAt for user {}: {}", userId, e.getMessage());
                }
                return true;
            }
        }
        return false;
    }
    public boolean isUserOnline(String userId) {
        Set<String> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }
    public LocalDateTime getLastActiveAt(String userId) {
        if (lastActiveCache.containsKey(userId)) {
            return lastActiveCache.get(userId);
        }
        return userRepository.findById(userId)
                .map(u -> u.getLastActiveAt())
                .orElse(null);
    }
}
