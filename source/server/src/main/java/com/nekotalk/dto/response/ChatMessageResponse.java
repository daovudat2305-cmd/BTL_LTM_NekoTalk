package com.nekotalk.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.nekotalk.common.MessageType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private String id;
    private String tempId;
    private String conversationId;
    private String conversationAvatar;
    private String senderId;
    private String senderName;
    private String content;
    private MessageType messageType;
    private List<MessageMediaResponse> messageMedia;
    private LocalDateTime createdAt;
}
