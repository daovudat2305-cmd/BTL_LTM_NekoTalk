package com.nekotalk.service;

import com.nekotalk.repository.ChatMessageRepository;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.nekotalk.dto.request.ChatMessageRequest;
import com.nekotalk.dto.response.ChatMessageResponse;
import com.nekotalk.dto.response.MessageMediaResponse;
import com.nekotalk.dto.response.PageResponse;
import com.nekotalk.entity.ChatMessage;
import com.nekotalk.entity.Conversation;
import com.nekotalk.entity.MessageMedia;
import com.nekotalk.entity.User;
import com.nekotalk.event.ChatMessageCreatedEvent;
import com.nekotalk.exception.AppException;
import com.nekotalk.exception.ErrorCode;
import com.nekotalk.repository.ConversationRepository;
import com.nekotalk.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

        private final ChatMessageRepository chatMessageRepository;
        private final UserRepository userRepository;
        private final ConversationRepository conversationRepository;

        private final ApplicationEventPublisher eventPublisher;

        @Transactional
        public ChatMessageResponse sendChatMessage(String senderId, ChatMessageRequest request) {
                // 1. Validate sender tồn tại
                User sender = userRepository.findById(senderId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                // 2. Validate conversation tồn tại và sender là member
                Conversation conversation = conversationRepository.findByIdAndMember(request.conversationId(), senderId)
                                .orElseThrow(() -> new AppException(ErrorCode.NOT_CONVERSATION_MEMBER));

                // 3. Tạo chat message entity
                ChatMessage message = ChatMessage.builder()
                                .conversation(conversation)
                                .sender(sender)
                                .content(request.content())
                                .messageType(request.messageType())
                                .build();

                // 4. Tạo danh sách media files (nếu có)
                // MessageMedia là POJO, sẽ được serialize thành JSON
                if (request.messageMedia() != null && !request.messageMedia().isEmpty()) {
                        List<MessageMedia> media = request.messageMedia().stream()
                                        .map(messageMedia -> MessageMedia.builder()
                                                        .fileName(messageMedia.fileName())
                                                        .fileType(messageMedia.fileType())
                                                        .thumbnailUrl(messageMedia.thumbnailUrl())
                                                        .message(message)
                                                        .build())
                                        .toList();

                        message.setMediaFiles(media);
                }

                // 5. Lưu message vào database
                chatMessageRepository.save(message);

                // 6. Update lastMessage của conversation
                conversation.setLastMessageSenderId(senderId);
                conversation.setLastMessageId(message.getId());
                conversation.setLastMessageContent(message.getContent());
                conversation.setLastMessageTime(message.getSentAt());

                conversationRepository.save(conversation);

                //7. Danh sách người nhận
                List<String> recipientIds = conversationRepository.findParticipantIdsByConversationIdAndSenderId(conversation.getId(), senderId);
                // 8. Map entity sang response DTO
                ChatMessageResponse response = ChatMessageResponse.builder()
                                .id(message.getId())
                                .tempId(request.tempId())
                                .conversationId(message.getConversation().getId())
                                .conversationAvatar(message.getConversation().getConversationAvatar())
                                .senderId(sender.getId())
                                .senderName(sender.getUsername())
                                .senderAvatar(sender.getAvatarUrl())
                                .content(message.getContent())
                                .messageType(message.getMessageType())
                                .messageMedia(message.getMediaFiles().stream()
                                                .map(messageMedia -> MessageMediaResponse.builder()
                                                                .fileName(messageMedia.getFileName())
                                                                .fileType(messageMedia.getFileType())
                                                                .thumbnailUrl(messageMedia.getThumbnailUrl())
                                                                .uploadedAt(messageMedia.getUploadedAt())
                                                                .build())
                                                .toList())
                                .createdAt(message.getSentAt())
                                .build();

                // 9. Bắn event để listener xử lý gửi WebSocket sau khi commit DB
                eventPublisher.publishEvent(new ChatMessageCreatedEvent(response, recipientIds));
        
                return response;
        }

        public PageResponse<ChatMessageResponse> getMessagesByConversationId(String conversationId, int page,
                        int size) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                String userId = authentication.getName();

                // Validate conversation tồn tại và user là member
                Conversation conversation = conversationRepository.findByIdAndMember(conversationId, userId)
                                .orElseThrow(() -> new AppException(ErrorCode.NOT_CONVERSATION_MEMBER));

                Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "sentAt"));

                Page<ChatMessage> chatMessagePage = chatMessageRepository.findByConversationId(conversationId,
                                pageable);

                List<ChatMessage> messages = chatMessagePage.getContent();

                List<ChatMessageResponse> responses = messages.stream()
                                .map(message -> ChatMessageResponse.builder()
                                                .id(message.getId())
                                                .conversationId(conversation.getId())
                                                .conversationAvatar(conversation.getConversationAvatar())
                                                .senderId(message.getSender().getId())
                                                .senderName(message.getSender().getUsername())
                                                .senderAvatar(message.getSender().getAvatarUrl())
                                                .content(message.getContent())
                                                .messageType(message.getMessageType())
                                                // map media files
                                                .messageMedia(message.getMediaFiles().stream()
                                                                .map(messageMedia -> MessageMediaResponse.builder()
                                                                                .fileName(messageMedia.getFileName())
                                                                                .fileType(messageMedia.getFileType())
                                                                                .thumbnailUrl(messageMedia
                                                                                                .getThumbnailUrl())
                                                                                .uploadedAt(messageMedia
                                                                                                .getUploadedAt())
                                                                                .build())
                                                                .toList())
                                                .createdAt(message.getSentAt())
                                                .build())
                                .toList();

                return PageResponse.<ChatMessageResponse>builder()
                                .currentPage(page)
                                .pageSize(pageable.getPageSize())
                                .totalPages(chatMessagePage.getTotalPages())
                                .totalElements(chatMessagePage.getTotalElements())
                                .content(responses)
                                .build();
        }

}
