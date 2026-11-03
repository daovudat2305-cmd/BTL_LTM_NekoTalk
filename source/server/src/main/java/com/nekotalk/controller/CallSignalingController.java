package com.nekotalk.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import com.nekotalk.dto.request.CallSignalRequest;
import com.nekotalk.service.CallService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class CallSignalingController {

    private final CallService callService;

    @MessageMapping("/call.signal")
    public void handleCallSignal(
            @Payload CallSignalRequest request,
            @Header("simpSessionId") String sessionId,
            Principal principal) {
        if (principal != null) {
            callService.handle(principal.getName(), sessionId, request);
        }
    }
}