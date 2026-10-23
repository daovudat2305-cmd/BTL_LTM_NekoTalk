package com.nekotalk.mapper;

import java.time.LocalDateTime;

import com.nekotalk.common.ConversationType;
import com.nekotalk.dto.response.ConversationDetailResponse;
import com.nekotalk.dto.response.CreateConversationResponse;
import com.nekotalk.dto.response.ParticipantResponse;
import com.nekotalk.entity.Conversation;
import com.nekotalk.entity.ConversationParticipant;

public final class ConversationMapper {
    private ConversationMapper() {

    }

    // map create conversation response
    public static CreateConversationResponse toConversationResponse(String creatorId, Conversation conversation) {
        ConversationType conversationType = conversation.getConversationType();

        // build response
        CreateConversationResponse response = CreateConversationResponse.builder()
                .id(conversation.getId())
                .conversationType(conversationType)
                .participantInfo(conversation.getParticipants().stream()
                        .map(participants -> ParticipantResponse.builder()
                                .userId(participants.getUser().getId())
                                .username(participants.getUser().getUsername())
                                .build())
                        .toList())
                .createdAt(conversation.getCreatedAt())
                .build();

        if (conversationType == ConversationType.PRIVATE) {
            // Với PRIVATE: tên là username của người còn lại (không phải creator)
            conversation.getParticipants()
                    .stream()
                    .filter(participants -> !participants.getUser().getId().equals(creatorId))
                    .findFirst()
                    .ifPresent(participantInfo -> {
                        response.setName(participantInfo.getUser().getUsername());
                        response.setConversationAvatar(participantInfo.getUser().getAvatarUrl());
                    });
        } else {
            // Với GROUP: dùng tên nhóm và avatar từ conversation
            response.setName(conversation.getName());
            response.setConversationAvatar(conversation.getConversationAvatar());
        }

        return response;
    }

    // map get my conversation response
    public static ConversationDetailResponse toConversationDetailResponse(String creatorId, Conversation conversation) {
        ConversationType conversationType = conversation.getConversationType();

        ConversationDetailResponse response = ConversationDetailResponse.builder()
                .id(conversation.getId())
                .conversationType(conversationType)
                // map list participants
                .participantInfo(conversation.getParticipants().stream()
                        .map(participants -> ParticipantResponse.builder()
                                .userId(participants.getUser().getId())
                                .username(participants.getUser().getUsername())
                                .build())
                        .toList())
                // last message
                .lastMessageId(conversation.getLastMessageId())
                .lastMessageContent(conversation.getLastMessageContent())
                .lastMessageTime(conversation.getLastMessageTime())
                .createdAt(conversation.getCreatedAt())
                .build();

        String name = resolveConversationName(creatorId, conversation);
        String avatar = resolveConversationAvatar(creatorId, conversation);

        response.setName(name);
        response.setConversationAvatar(avatar);

        ConversationParticipant currentParticipant = conversation.getParticipants().stream()
            .filter(p -> p.getUser().getId().equals(creatorId))
            .findFirst()
            .orElse(null);
        
        boolean hasUnread = false;
        if(conversation.getLastMessageTime() != null && currentParticipant != null) {
            LocalDateTime lastRead = currentParticipant.getLastReadAt();
            if(lastRead == null || lastRead.isBefore(conversation.getLastMessageTime())) {
                // Kiểm tra nếu tin nhắn cuối KHÔNG PHẢI do chính mình gửi thì mới tính là Chưa đọc
                // (Nếu Conversation có lưu lastMessageSenderId hoặc tin nhắn cuối)
                hasUnread = true; 
            }
        }

        response.setHasUnread(hasUnread);

        return response;
    }

    // PRIVATE: Tên của người còn lại (không phải creatorId)
    // GROUP: Tên nhóm
    private static String resolveConversationName(String creatorId, Conversation conversation) {
        if (conversation.getConversationType() == ConversationType.PRIVATE) {
            return conversation.getParticipants()
                    .stream()
                    .filter(p -> !p.getUser().getId().equals(creatorId))
                    .findFirst()
                    .map(p -> p.getUser().getUsername())
                    .orElse(null);
        }
        return conversation.getName();
    }

    private static String resolveConversationAvatar(String currentUserId, Conversation conversation) {
        if(conversation.getConversationType() == ConversationType.PRIVATE) {
            return conversation.getParticipants()
                .stream()
                .filter(p -> !p.getUser().getId().equals(currentUserId))
                .findFirst()
                .map(p -> p.getUser().getAvatarUrl())
                .orElse(null);
        }
        return conversation.getConversationAvatar();
    }
}
