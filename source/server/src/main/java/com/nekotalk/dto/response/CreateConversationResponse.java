package com.nekotalk.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.nekotalk.common.ConversationType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateConversationResponse {
    private String id;
    private String name;
    private String conversationAvatar;
    private ConversationType conversationType;
    private List<ParticipantResponse> participantInfo;
    private LocalDateTime createdAt;
}