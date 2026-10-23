package com.nekotalk.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

import com.nekotalk.common.ConversationType;

@Entity
@Table(name = "conversations")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String name;

    String conversationAvatar;

    ConversationType conversationType;

    @Column(name = "participant_hash", unique = true)
    String participantHash;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    List<ConversationParticipant> participants = new ArrayList<>();

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    List<ChatMessage> messages = new ArrayList<>();

    LocalDateTime createdAt;

    String lastMessageSenderId;
    String lastMessageId;
    String lastMessageContent;
    LocalDateTime lastMessageTime;

    public void addParticipant(User user) {
        participants.add(ConversationParticipant.builder()
                .user(user) // set relationship với user
                .conversation(this) // set relationship với conversation
                .build());
    }
}
