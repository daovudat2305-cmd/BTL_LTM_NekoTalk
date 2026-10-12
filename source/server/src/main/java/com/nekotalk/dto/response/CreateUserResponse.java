package com.nekotalk.dto.response;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class CreateUserResponse {
    private String username;
    private String email;
}
