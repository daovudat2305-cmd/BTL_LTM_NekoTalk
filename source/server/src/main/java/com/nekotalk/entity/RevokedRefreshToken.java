package com.nekotalk.entity;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.*;

@Entity 
@Table(name = "revoked_refresh_tokens")
@Getter
@NoArgsConstructor (access= AccessLevel.PROTECTED)
public class RevokedRefreshToken {
    @Id
    @Column(length =64)
    private String tokenHash;

    @Column(nullable= false)
    private String userId;

    @Column(nullable= false)
    private Instant revokedAt;

    public RevokedRefreshToken(String tokenHash, String userId, Instant revokedAt){
        this.tokenHash= tokenHash;
        this.userId= userId;
        this.revokedAt= revokedAt;
    }
}
