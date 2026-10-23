package com.nekotalk.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nekotalk.common.ConversationType;
import com.nekotalk.dto.request.CreateConversationRequest;
import com.nekotalk.dto.response.ConversationDetailResponse;
import com.nekotalk.dto.response.CreateConversationResponse;
import com.nekotalk.dto.response.PageResponse;
import com.nekotalk.dto.response.ReadReceiptResponse;
import com.nekotalk.entity.Conversation;
import com.nekotalk.entity.User;
import com.nekotalk.exception.AppException;
import com.nekotalk.exception.ErrorCode;
import com.nekotalk.mapper.ConversationMapper;
import com.nekotalk.repository.ConversationParticipantRepository;
import com.nekotalk.repository.ConversationRepository;
import com.nekotalk.repository.UserRepository;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final ConversationParticipantRepository participantRepository;

    public CreateConversationResponse createConversation(String creatorId, CreateConversationRequest request) {
        List<String> participantIds = request.participantIds();

        if (!participantIds.contains(creatorId)) {
            participantIds.add(creatorId);
        }

        List<User> participantInfos = userRepository.findAllById(participantIds);

        if (participantInfos.size() != participantIds.size()) {
            throw new AppException(ErrorCode.PARTICIPANT_NOT_FOUND);
        }

        ConversationType conversationType = request.conversationType();

        String participantHash = null;

        if (conversationType == ConversationType.PRIVATE) {
            if (participantInfos.size() != 2) {
                throw new AppException(ErrorCode.INVALID_PARTICIPANT_COUNT);
            }
            participantHash = participantInfos.stream()
                    .map(User::getId)
                    .sorted()
                    .collect(Collectors.joining("_"));

            Optional<Conversation> existing = conversationRepository.findByParticipantHash(participantHash);
            if (existing.isPresent()) {
                return ConversationMapper.toConversationResponse(creatorId, existing.get());
            }
        }

        if (conversationType == ConversationType.GROUP) {
            if (request.name() == null || request.name().trim().isEmpty()) {
                throw new AppException(ErrorCode.CONVERSATION_NAME_REQUIRED);
            }

            if (participantIds.size() < 3) {
                throw new AppException(ErrorCode.GROUP_CONVERSATION_MINIMUM_THREE_PARTICIPANTS);
            }
        }

        Conversation conversation = Conversation.builder()
                .name(request.name())
                .conversationType(conversationType)
                .conversationAvatar(request.conversationAvatar())
                .participantHash(participantHash)
                .createdAt(LocalDateTime.now())
                .build();

        participantInfos.forEach(conversation::addParticipant);

        conversationRepository.save(conversation);

        // Bắn WebSocket thông báo tới các thành viên (những người được thêm vào nhóm/cuộc trò chuyện)
        for (User participant : participantInfos) {
            String memberId = participant.getId();
            try {
                ConversationDetailResponse detail = ConversationMapper.toConversationDetailResponse(memberId, conversation);
                simpMessagingTemplate.convertAndSendToUser(memberId, "/queue/conversations", detail);
            } catch (Exception e) {
                log.error("Failed to push conversation notification to user {}: {}", memberId, e.getMessage());
            }
        }

        return ConversationMapper.toConversationResponse(creatorId, conversation);
    }

    public PageResponse<ConversationDetailResponse> getMyConversation(String userId, int page, int size) {
        // Step 1: Query conversations với pagination (không fetch collections)
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<Conversation> conversationPage = conversationRepository.findAllByUserId(userId, pageable);

        // Step 2: Extract conversation IDs từ paginated results
        List<String> conversationIds = conversationPage.getContent().stream()
                .map(Conversation::getId)
                .toList();

        // Step 3: Fetch collections cho conversations đã được paginate
        // Empty check để tránh query với empty list
        List<Conversation> conversationsWithParticipants = conversationIds.isEmpty() ? List.of()
                : conversationRepository.findByIdInWithParticipants(conversationIds);

        // Dùng Map để khôi phục đúng thứ tự ban đầu từ conversationIds (Step 1)
        Map<String, Conversation> conversationMap = conversationsWithParticipants.stream()
            .collect(Collectors.toMap(Conversation::getId, Function.identity()));

        List<ConversationDetailResponse> responses = conversationIds.stream()
                .map(conversationMap::get)
                .filter(Objects::nonNull)
                .map(conversation -> ConversationMapper.toConversationDetailResponse(userId, conversation))
                .toList();

        return PageResponse.<ConversationDetailResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(conversationPage.getTotalPages())
                .totalElements(conversationPage.getTotalElements())
                .content(responses)
                .build();
    }

    @Transactional
    public void markConversationAsRead(String userId, String conversationId) {
        LocalDateTime now = LocalDateTime.now();

        participantRepository.updateLastReadAt(conversationId, userId, now);

        List<String> otherMemberIds = conversationRepository.findParticipantIdsByConversationIdAndSenderId(conversationId, userId);

        User currentUser = userRepository.findById(userId).orElse(null);
        String username = currentUser != null ? currentUser.getUsername() : "Ai đó";

        ReadReceiptResponse receipt = ReadReceiptResponse.builder()
            .conversationId(conversationId)
            .readerId(userId)
            .readerName(username)
            .readAt(now)
            .build();

        //bắn socket thông báo
        for(String memberId : otherMemberIds) {
            try {
                simpMessagingTemplate.convertAndSendToUser(memberId, "/queue/read-receipts", receipt);
            } catch (Exception e) {
                log.error("Failed to push read receipt to {}: {}", memberId, e.getMessage());
            }
        }
    }
}
