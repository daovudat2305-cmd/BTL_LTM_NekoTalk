package com.nekotalk.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nekotalk.entity.ConversationParticipant;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant,String>{

    Optional<ConversationParticipant> findByConversationIdAndUserId(String conversationId, String userId);

    @Modifying
    @Query("""
        UPDATE ConversationParticipant cp
        SET cp.lastReadAt = :readAt
        WHERE cp.conversation.id = :conversationId AND cp.user.id = :userId
    """)
    void updateLastReadAt(
        @Param("conversationId") String conversationId,
        @Param("userId") String userId,
        @Param("readAt") LocalDateTime readAt
    );
}
