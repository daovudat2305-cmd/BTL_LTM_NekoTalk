package com.nekotalk.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.nekotalk.common.ConversationType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // không serialize các field null
public class ConversationDetailResponse {
    private String id;
    private ConversationType conversationType;
    private String name;
    private String conversationAvatar;
    private List<ParticipantResponse> participantInfo;

    // last message
    private String lastMessageId;
    private String lastMessageContent;
    private LocalDateTime lastMessageTime;

    private LocalDateTime createdAt;

    private Boolean hasUnread;
    private String lastMessageSenderId;

    private Boolean isOnline;
    private LocalDateTime lastOnlineAt;
}
