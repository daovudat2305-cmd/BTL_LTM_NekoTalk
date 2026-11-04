package com.nekotalk.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
public class GroupCallService {

    private static final int MAX_PARTICIPANTS = 4;
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
                case "REJECT" -> reject(userId, request);
                case "CANCEL" -> cancel(userId, request);
                case "OFFER", "ANSWER" -> relayDescription(userId, request);
                case "ICE" -> relayIce(userId, request);
                case "HANGUP" -> leave(userId, request);
                default -> sendError(userId, request, "Loại tín hiệu cuộc gọi nhóm không được hỗ trợ.");
            }
        } catch (IllegalArgumentException exception) {
            sendError(userId, request, exception.getMessage());
        }
    }

    public synchronized void handleDisconnect(String userId, String sessionId) {
        String callId = userCallIds.get(userId);
        ActiveCall call = callId == null ? null : activeCalls.get(callId);
        Member member = call == null ? null : call.members.get(userId);
        if (member == null || !member.sessionId.equals(sessionId)) {
            return;
        }
        if (call.callerId.equals(userId)) {
            close(call, "DISCONNECTED", userId, "Người tạo cuộc gọi đã ngắt kết nối.");
        } else if (member.joined) {
            removeMember(call, userId, "LEFT");
        } else {
            removePendingMember(call, userId);
        }
    }

    private void invite(String callerId, String sessionId, CallSignalRequest request) {
        requireText(request.callId(), "Thiếu mã cuộc gọi.");
        requireText(request.conversationId(), "Thiếu cuộc trò chuyện.");
        requireText(request.callType(), "Thiếu loại cuộc gọi.");
        if (!"VOICE".equals(request.callType()) && !"VIDEO".equals(request.callType())) {
            throw new IllegalArgumentException("Chỉ hỗ trợ gọi thoại hoặc gọi video.");
        }
        if (activeCalls.containsKey(request.callId())) {
            throw new IllegalArgumentException("Mã cuộc gọi đã được sử dụng.");
        }

        Conversation conversation = conversationRepository
                .findByIdAndMember(request.conversationId(), callerId)
                .orElseThrow(() -> new IllegalArgumentException("Bạn không thuộc cuộc trò chuyện này."));
        if (!"GROUP".equals(conversation.getConversationType().name())) {
            throw new IllegalArgumentException("Cuộc gọi nhóm chỉ dùng trong nhóm chat.");
        }

        List<String> conversationInvitees = conversationRepository
                .findParticipantIdsByConversationIdAndSenderId(request.conversationId(), callerId);
        if (conversationInvitees.isEmpty()) {
            throw new IllegalArgumentException("Nhóm chưa có thành viên để mời.");
        }
        if (request.targetUserId() != null && !request.targetUserId().isBlank()) {
            throw new IllegalArgumentException("Lời mời gọi nhóm không nhận một người nhận riêng.");
        }
        if (userCallIds.containsKey(callerId)) {
            throw new IllegalArgumentException("Bạn đang tham gia một cuộc gọi khác.");
        }
        List<String> inviteeIds = conversationInvitees.stream()
                .filter(inviteeId -> !userCallIds.containsKey(inviteeId))
                .toList();
        if (inviteeIds.isEmpty()) {
            throw new IllegalArgumentException("Các thành viên khác đang tham gia cuộc gọi khác.");
        }

        ActiveCall call = new ActiveCall(request.callId(), request.conversationId(), callerId,
                request.callType(), Instant.now());
        call.members.put(callerId, new Member(sessionId, username(callerId), true));
        for (String inviteeId : inviteeIds) {
            call.members.put(inviteeId, new Member(null, username(inviteeId), false));
        }
        activeCalls.put(call.callId, call);
        call.members.keySet().forEach(memberId -> userCallIds.put(memberId, call.callId));

        for (String inviteeId : inviteeIds) {
            send(inviteeId, response("INVITE", call, callerId, inviteeId, null, null, null, null, null));
        }
    }

    private void accept(String userId, String sessionId, CallSignalRequest request) {
        ActiveCall call = requireCall(userId, request);
        Member member = call.members.get(userId);
        if (member.joined || member.sessionId != null) {
            throw new IllegalArgumentException("Bạn đã tham gia cuộc gọi này.");
        }
        if (joinedMemberIds(call).size() >= MAX_PARTICIPANTS) {
            removePendingMember(call, userId);
            sendError(userId, request, "Cuộc gọi đã đủ 4 người.");
            return;
        }
        member.sessionId = sessionId;
        member.joined = true;
        for (String recipientId : joinedMemberIds(call)) {
            send(recipientId, response("JOINED", call, userId, recipientId, null, null, null, null, null));
        }
    }

    private void reject(String userId, CallSignalRequest request) {
        ActiveCall call = requireCall(userId, request);
        Member member = call.members.get(userId);
        if (member.joined || member.sessionId != null || call.callerId.equals(userId)) {
            throw new IllegalArgumentException("Không thể từ chối lời mời này.");
        }
        send(call.callerId, response("REJECTED", call, userId, call.callerId, null, null, null, null, null));
        removePendingMember(call, userId);
    }

    private void cancel(String userId, CallSignalRequest request) {
        ActiveCall call = requireCall(userId, request);
        if (!call.callerId.equals(userId)) {
            throw new IllegalArgumentException("Chỉ người tạo cuộc gọi mới có thể hủy.");
        }
        close(call, "CANCELLED", userId, null);
    }

    private void leave(String userId, CallSignalRequest request) {
        ActiveCall call = requireCall(userId, request);
        Member member = call.members.get(userId);
        if (!member.joined) {
            throw new IllegalArgumentException("Bạn chưa tham gia cuộc gọi.");
        }
        if (call.callerId.equals(userId)) {
            close(call, "ENDED", userId, null);
        } else {
            removeMember(call, userId, "LEFT");
        }
    }

    private void relayDescription(String userId, CallSignalRequest request) {
        ActiveCall call = requireCall(userId, request);
        Member sender = call.members.get(userId);
        Member recipient = requireJoinedTarget(call, userId, request.targetUserId());
        requireJoined(sender);
        String pairKey = pairKey(userId, request.targetUserId());
        if ("OFFER".equals(request.type())) {
            if (userId.compareTo(request.targetUserId()) > 0) {
                throw new IllegalArgumentException("Chỉ một thành viên trong mỗi cặp được tạo offer.");
            }
            if (!call.offeredPairs.add(pairKey)) {
                throw new IllegalArgumentException("Offer cho thành viên này đã được gửi.");
            }
        } else if (userId.compareTo(request.targetUserId()) < 0 || !call.offeredPairs.contains(pairKey)) {
            throw new IllegalArgumentException("Answer không hợp lệ.");
        }
        requireText(request.sdp(), "Thiếu nội dung SDP.");
        send(request.targetUserId(), response(request.type(), call, userId, request.targetUserId(),
                request.sdp(), null, null, null, null));
    }

    private void relayIce(String userId, CallSignalRequest request) {
        ActiveCall call = requireCall(userId, request);
        requireJoined(call.members.get(userId));
        requireJoinedTarget(call, userId, request.targetUserId());
        requireText(request.candidate(), "Thiếu ICE candidate.");
        send(request.targetUserId(), response("ICE", call, userId, request.targetUserId(), null,
                request.candidate(), request.sdpMid(), request.sdpMLineIndex(), null));
    }

    @Scheduled(fixedDelay = 5_000)
    public synchronized void expireRingingCalls() {
        Instant cutoff = Instant.now().minusSeconds(RING_TIMEOUT_SECONDS);
        for (ActiveCall call : new ArrayList<>(activeCalls.values())) {
            if (!call.createdAt.isBefore(cutoff)) {
                continue;
            }
            List<String> pendingIds = call.members.entrySet().stream()
                    .filter(entry -> !entry.getValue().joined)
                    .map(Map.Entry::getKey)
                    .toList();
            if (joinedMemberIds(call).size() == 1) {
                close(call, "MISSED", null, "Không có người trả lời.");
                continue;
            }
            for (String pendingId : pendingIds) {
                send(call.callerId, response("MISSED", call, pendingId, call.callerId, null, null,
                        null, null, null));
                removePendingMember(call, pendingId);
            }
        }
    }

    private ActiveCall requireCall(String userId, CallSignalRequest request) {
        requireText(request.callId(), "Thiếu mã cuộc gọi.");
        ActiveCall call = activeCalls.get(request.callId());
        if (call == null || !call.conversationId.equals(request.conversationId())
                || !call.members.containsKey(userId)) {
            throw new IllegalArgumentException("Cuộc gọi không tồn tại hoặc bạn không có quyền truy cập.");
        }
        return call;
    }

    private Member requireJoinedTarget(ActiveCall call, String userId, String targetUserId) {
        requireText(targetUserId, "Thiếu người nhận tín hiệu.");
        if (userId.equals(targetUserId)) {
            throw new IllegalArgumentException("Không thể gửi tín hiệu cho chính mình.");
        }
        Member target = call.members.get(targetUserId);
        if (target == null || !target.joined) {
            throw new IllegalArgumentException("Người nhận chưa tham gia cuộc gọi.");
        }
        return target;
    }

    private void requireJoined(Member member) {
        if (member == null || !member.joined) {
            throw new IllegalArgumentException("Bạn chưa tham gia cuộc gọi.");
        }
    }

    private void removeMember(ActiveCall call, String userId, String eventType) {
        call.members.remove(userId);
        call.offeredPairs.removeIf(pair -> pair.startsWith(userId + "\u0000")
            || pair.endsWith("\u0000" + userId));
        userCallIds.remove(userId, call.callId);
        for (String recipientId : joinedMemberIds(call)) {
            send(recipientId, response(eventType, call, userId, recipientId, null, null, null, null, null));
        }
    }

    private void removePendingMember(ActiveCall call, String userId) {
        call.members.remove(userId);
        userCallIds.remove(userId, call.callId);
        if (call.members.size() <= 1) {
            close(call, "MISSED", null, "Không có người trả lời.");
        }
    }

    private void close(ActiveCall call, String type, String senderId, String message) {
        if (!activeCalls.remove(call.callId, call)) {
            return;
        }
        for (String memberId : call.members.keySet()) {
            userCallIds.remove(memberId, call.callId);
            send(memberId, response(type, call, senderId, memberId, null, null, null, null, message));
        }
    }

    private List<String> joinedMemberIds(ActiveCall call) {
        return call.members.entrySet().stream()
                .filter(entry -> entry.getValue().joined)
                .map(Map.Entry::getKey)
                .toList();
    }

    private CallSignalResponse response(String type, ActiveCall call, String fromUserId, String targetUserId,
            String sdp, String candidate, String sdpMid, Integer sdpMLineIndex, String message) {
        User sender = fromUserId == null ? null : userRepository.findById(fromUserId).orElse(null);
        return CallSignalResponse.builder()
                .type(type)
                .callId(call.callId)
                .conversationId(call.conversationId)
                .fromUserId(fromUserId)
                .fromUsername(sender == null ? null : sender.getUsername())
                .targetUserId(targetUserId)
                .groupCall(true)
                .callType(call.callType)
                .sdp(sdp)
                .candidate(candidate)
                .sdpMid(sdpMid)
                .sdpMLineIndex(sdpMLineIndex)
                .message(message)
                .build();
    }

    private void sendError(String userId, CallSignalRequest request, String message) {
        send(userId, CallSignalResponse.builder()
                .type("ERROR")
                .callId(request == null ? null : request.callId())
                .conversationId(request == null ? null : request.conversationId())
                .groupCall(true)
                .message(message)
                .build());
    }

    private void send(String userId, CallSignalResponse response) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/calls", response);
    }

    private String username(String userId) {
        return userRepository.findById(userId).map(User::getUsername).orElse("Người dùng");
    }

    private String pairKey(String firstUserId, String secondUserId) {
        return firstUserId.compareTo(secondUserId) < 0
                ? firstUserId + "\u0000" + secondUserId
                : secondUserId + "\u0000" + firstUserId;
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
        private final String callType;
        private final Instant createdAt;
        private final Map<String, Member> members = new LinkedHashMap<>();
        private final Set<String> offeredPairs = ConcurrentHashMap.newKeySet();

        private ActiveCall(String callId, String conversationId, String callerId, String callType, Instant createdAt) {
            this.callId = callId;
            this.conversationId = conversationId;
            this.callerId = callerId;
            this.callType = callType;
            this.createdAt = createdAt;
        }
    }

    private static final class Member {
        private String sessionId;
        private final String username;
        private boolean joined;

        private Member(String sessionId, String username, boolean joined) {
            this.sessionId = sessionId;
            this.username = username;
            this.joined = joined;
        }
    }
}
