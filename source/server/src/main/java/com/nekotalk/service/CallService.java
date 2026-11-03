package com.nekotalk.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.nekotalk.dto.request.CallSignalRequest;
import com.nekotalk.dto.response.CallSignalResponse;
import com.nekotalk.entity.Conversation;
import com.nekotalk.entity.User;
import com.nekotalk.repository.ConversationRepository;
import com.nekotalk.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CallService {

    private static final long RING_TIMEOUT_SECONDS = 35;

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String, ActiveCall> activeCalls = new ConcurrentHashMap<>();
    private final Map<String, String> userCallIds = new ConcurrentHashMap<>();

    public synchronized void handle(String userId, String sessionId, CallSignalRequest request) {
        if (request == null || request.type() == null) {
            sendError(userId, request, "Yêu cầu cuộc gọi không hợp lệ.");
            return;
        }

        try {
            switch (request.type()) {
                case "INVITE" -> invite(userId, sessionId, request);
                case "ACCEPT" -> accept(userId, sessionId, request);
                case "REJECT" -> finish(userId, request, "REJECTED", false);
                case "CANCEL" -> finish(userId, request, "CANCELLED", false);
                case "OFFER" -> relayDescription(userId, request, "OFFER");
                case "ANSWER" -> relayDescription(userId, request, "ANSWER");
                case "ICE" -> relayIce(userId, request);
                case "HANGUP" -> finish(userId, request, "ENDED", true);
                default -> sendError(userId, request, "Loại tín hiệu cuộc gọi không được hỗ trợ.");
            }
        } catch (IllegalArgumentException exception) {
            sendError(userId, request, exception.getMessage());
        }
    }

    public synchronized void handleDisconnect(String userId, String sessionId) {
        String callId = userCallIds.get(userId);
        ActiveCall call = callId == null ? null : activeCalls.get(callId);
        if (call != null && call.containsSession(sessionId)) {
            close(call, "DISCONNECTED", userId, "Kết nối của một người tham gia đã đóng.");
        }
    }

    private void invite(String callerId, String sessionId, CallSignalRequest request) {
        requireText(request.callId(), "Thiếu mã cuộc gọi.");
        requireText(request.conversationId(), "Thiếu cuộc trò chuyện.");
        requireText(request.targetUserId(), "Thiếu người nhận cuộc gọi.");
        if (!"VOICE".equals(request.callType()) && !"VIDEO".equals(request.callType())) {
            throw new IllegalArgumentException("Chỉ hỗ trợ gọi thoại hoặc gọi video.");
        }
        if (activeCalls.containsKey(request.callId())) {
            throw new IllegalArgumentException("Mã cuộc gọi đã được sử dụng.");
        }

        Conversation conversation = conversationRepository
                .findByIdAndMember(request.conversationId(), callerId)
                .orElseThrow(() -> new IllegalArgumentException("Bạn không thuộc cuộc trò chuyện này."));
        if (!"PRIVATE".equals(conversation.getConversationType().name())) {
            throw new IllegalArgumentException("Chỉ hỗ trợ gọi trong cuộc trò chuyện 1-1.");
        }

        List<String> participantIds = conversationRepository
                .findParticipantIdsByConversationIdAndSenderId(request.conversationId(), callerId);
        if (participantIds.size() != 1 || !participantIds.get(0).equals(request.targetUserId())) {
            throw new IllegalArgumentException("Người nhận không thuộc cuộc trò chuyện này.");
        }
        if (userCallIds.containsKey(callerId) || userCallIds.containsKey(request.targetUserId())) {
            throw new IllegalArgumentException("Một trong hai người đang có cuộc gọi khác.");
        }

        ActiveCall call = new ActiveCall(request.callId(), request.conversationId(), callerId,
            request.targetUserId(), sessionId, request.callType(), Instant.now());
        activeCalls.put(call.callId(), call);
        userCallIds.put(callerId, call.callId());
        userCallIds.put(request.targetUserId(), call.callId());
        send(call.calleeId(), response("INVITE", call, callerId, call.callType(), null, null, null, null, null));
    }

    private void accept(String userId, String sessionId, CallSignalRequest request) {
        ActiveCall call = requireCall(userId, request);
        if (!call.calleeId().equals(userId) || call.accepted()) {
            throw new IllegalArgumentException("Không thể nhận cuộc gọi này.");
        }
        call.accepted = true;
        call.calleeSessionId = sessionId;
        send(call.callerId(), response("ACCEPT", call, userId, call.callType(), null, null, null, null, null));
    }

    private void relayDescription(String userId, CallSignalRequest request, String type) {
        ActiveCall call = requireCall(userId, request);
        requireAccepted(call);
        requireText(request.sdp(), "Thiếu nội dung SDP.");
        if ("OFFER".equals(type) && !call.callerId().equals(userId)) {
            throw new IllegalArgumentException("Chỉ người gọi mới được gửi offer.");
        }
        if ("ANSWER".equals(type) && (!call.calleeId().equals(userId) || !call.offerSent)) {
            throw new IllegalArgumentException("Answer không hợp lệ.");
        }
        if ("OFFER".equals(type)) {
            call.offerSent = true;
        }
        send(otherParticipant(call, userId), response(type, call, userId, call.callType(), request.sdp(), null,
                null, null, null));
    }

    private void relayIce(String userId, CallSignalRequest request) {
        ActiveCall call = requireCall(userId, request);
        requireAccepted(call);
        requireText(request.candidate(), "Thiếu ICE candidate.");
        send(otherParticipant(call, userId), response("ICE", call, userId, call.callType(), null,
                request.candidate(), request.sdpMid(), request.sdpMLineIndex(), null));
    }

    private void finish(String userId, CallSignalRequest request, String type, boolean acceptedOnly) {
        ActiveCall call = requireCall(userId, request);
        if (acceptedOnly != call.accepted) {
            throw new IllegalArgumentException("Trạng thái cuộc gọi không hợp lệ.");
        }
        if ("CANCELLED".equals(type) && !call.callerId().equals(userId)) {
            throw new IllegalArgumentException("Chỉ người gọi mới có thể hủy lời mời.");
        }
        if ("REJECTED".equals(type) && !call.calleeId().equals(userId)) {
            throw new IllegalArgumentException("Chỉ người nhận mới có thể từ chối lời mời.");
        }
        close(call, type, userId, null);
    }

    @Scheduled(fixedDelay = 5_000)
    public synchronized void expireRingingCalls() {
        Instant cutoff = Instant.now().minusSeconds(RING_TIMEOUT_SECONDS);
        activeCalls.values().stream()
                .filter(call -> !call.accepted() && call.createdAt().isBefore(cutoff))
                .toList()
                .forEach(call -> close(call, "MISSED", null, "Không có người trả lời."));
    }

    private ActiveCall requireCall(String userId, CallSignalRequest request) {
        requireText(request.callId(), "Thiếu mã cuộc gọi.");
        ActiveCall call = activeCalls.get(request.callId());
        if (call == null || !call.contains(userId)
                || !call.conversationId().equals(request.conversationId())) {
            throw new IllegalArgumentException("Cuộc gọi không tồn tại hoặc bạn không có quyền truy cập.");
        }
        return call;
    }

    private void requireAccepted(ActiveCall call) {
        if (!call.accepted()) {
            throw new IllegalArgumentException("Cuộc gọi chưa được nhận.");
        }
    }

    private String otherParticipant(ActiveCall call, String userId) {
        return call.callerId().equals(userId) ? call.calleeId() : call.callerId();
    }

    private void close(ActiveCall call, String type, String senderId, String message) {
        if (!activeCalls.remove(call.callId(), call)) {
            return;
        }
        userCallIds.remove(call.callerId(), call.callId());
        userCallIds.remove(call.calleeId(), call.callId());
        String recipientId = senderId == null ? null : otherParticipant(call, senderId);
        CallSignalResponse event = response(type, call, senderId, call.callType(), null, null, null, null, message);
        if (recipientId == null) {
            send(call.callerId(), event);
            send(call.calleeId(), event);
        } else {
            send(recipientId, event);
            send(senderId, event);
        }
    }

    private void sendError(String userId, CallSignalRequest request, String message) {
        String callId = request == null ? null : request.callId();
        String conversationId = request == null ? null : request.conversationId();
        send(userId, CallSignalResponse.builder()
                .type("ERROR")
                .callId(callId)
                .conversationId(conversationId)
                .message(message)
                .build());
    }

    private CallSignalResponse response(String type, ActiveCall call, String fromUserId, String callType,
            String sdp, String candidate, String sdpMid, Integer sdpMLineIndex, String message) {
        User sender = "INVITE".equals(type) && fromUserId != null
            ? userRepository.findById(fromUserId).orElse(null)
            : null;
        return CallSignalResponse.builder()
                .type(type)
                .callId(call.callId())
                .conversationId(call.conversationId())
                .fromUserId(fromUserId)
                .fromUsername(sender == null ? null : sender.getUsername())
                .callType(callType)
                .sdp(sdp)
                .candidate(candidate)
                .sdpMid(sdpMid)
                .sdpMLineIndex(sdpMLineIndex)
                .message(message)
                .build();
    }

    private void send(String userId, CallSignalResponse response) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/calls", response);
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    private static final class ActiveCall {
        private final String callId;
        private final String conversationId;
        private final String callerId;
        private final String calleeId;
        private final String callerSessionId;
        private final String callType;
        private final Instant createdAt;
        private String calleeSessionId;
        private boolean accepted;
        private boolean offerSent;

        private ActiveCall(String callId, String conversationId, String callerId, String calleeId,
            String callerSessionId, String callType, Instant createdAt) {
            this.callId = callId;
            this.conversationId = conversationId;
            this.callerId = callerId;
            this.calleeId = calleeId;
            this.callerSessionId = callerSessionId;
            this.callType = callType;
            this.createdAt = createdAt;
        }

        private String callId() { return callId; }
        private String conversationId() { return conversationId; }
        private String callerId() { return callerId; }
        private String calleeId() { return calleeId; }
        private Instant createdAt() { return createdAt; }
        private boolean accepted() { return accepted; }
        private String callType() { return callType; }
        private boolean contains(String userId) { return callerId.equals(userId) || calleeId.equals(userId); }
        private boolean containsSession(String sessionId) {
            return callerSessionId.equals(sessionId) || sessionId.equals(calleeSessionId);
        }
    }
}