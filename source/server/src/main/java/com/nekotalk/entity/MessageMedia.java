package com.nekotalk.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "message_media")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    ChatMessage message;

    @Column(nullable = false)
    String fileName;

    @Column(nullable = false)
    String thumbnailUrl;

    @Column(nullable = false)
    String fileType;

    @Column(name = "uploaded_at", nullable = false)
    @Builder.Default
    LocalDateTime uploadedAt = LocalDateTime.now();
}
