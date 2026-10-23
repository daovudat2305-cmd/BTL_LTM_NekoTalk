package com.nekotalk.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceResponse {
    private String userId;
    private Boolean isOnline;
    private LocalDateTime lastOnlineAt;
}
