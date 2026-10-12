package com.nekotalk.mapper;

import com.nekotalk.common.ConversationType;
import com.nekotalk.dto.response.ConversationDetailResponse;
import com.nekotalk.dto.response.CreateConversationResponse;
import com.nekotalk.dto.response.ParticipantResponse;
import com.nekotalk.entity.Conversation;

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
                    .ifPresent(participantInfo -> response.setName(participantInfo.getUser().getUsername()));
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

        response.setName(name);

        // set conversation avatar
        if (conversationType == ConversationType.GROUP) {
            response.setConversationAvatar(conversation.getConversationAvatar());
        }

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
}
