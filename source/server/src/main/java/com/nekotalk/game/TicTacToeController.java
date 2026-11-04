package com.nekotalk.game;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.nekotalk.game.dto.TicTacToeRequest;
import com.nekotalk.game.dto.TicTacToeResponse;
import com.nekotalk.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j(topic = "TIC-TAC-TOE")
public class TicTacToeController {

    private final SimpMessagingTemplate messagingTemplate;
    private final TicTacToeSessionManager sessionManager;
    private final UserRepository userRepository;

    private static final String QUEUE = "/queue/game.ttt";

    @MessageMapping("/game.ttt")
    public void handle(@Payload TicTacToeRequest req, Principal principal) {
        if (principal == null) return;
        String senderId = principal.getName();

        switch (req.type()) {
            case "INVITE"  -> handleInvite(req, senderId);
            case "ACCEPT"  -> handleAccept(req, senderId);
            case "DECLINE" -> handleDecline(req, senderId);
            case "MOVE"    -> handleMove(req, senderId);
            case "RESIGN"  -> handleResign(req, senderId);
            default        -> log.warn("[TTT] Unknown type: {}", req.type());
        }
    }

    // invite
    private void handleInvite(TicTacToeRequest req, String inviterId) {
        String targetUserId = req.targetUserId();
        // Kiểm tra cả 2 không đang chơi ván khác
        if (sessionManager.isPlayerInGame(inviterId)) {
            sendTo(inviterId, TicTacToeResponse.error("Bạn đang trong một ván cờ khác."));
            return;
        }
        if (sessionManager.isPlayerInGame(targetUserId)) {
            sendTo(inviterId, TicTacToeResponse.error(req.targetUsername() + " đang bận chơi cờ."));
            return;
        }
        // Tạo "pre-session" id để client dùng khi ACCEPT
        String tempInviteId = inviterId;
        String inviterName = userRepository.findById(inviterId)
                .map(u -> u.getUsername()).orElse("Người dùng");
        log.info("[TTT] {} ({}) mời {} chơi", inviterName, inviterId, targetUserId);
        // Gửi lời mời tới target
        sendTo(targetUserId, TicTacToeResponse.invite(inviterId, inviterName, tempInviteId));
    }

    // accept
    private void handleAccept(TicTacToeRequest req, String acceptorId) {
        // gameId tạm = inviterId
        String inviterId = req.gameId();
        if (sessionManager.isPlayerInGame(acceptorId) || sessionManager.isPlayerInGame(inviterId)) {
            sendTo(acceptorId, TicTacToeResponse.error("Một trong hai người đang bận."));
            return;
        }
        String acceptorName = userRepository.findById(acceptorId)
                .map(u -> u.getUsername()).orElse("Người dùng");
        String inviterName = userRepository.findById(inviterId)
                .map(u -> u.getUsername()).orElse("Người dùng");
        // Người được mời = X (đi trước), người mời = O (đi sau)
        TicTacToeSession session = sessionManager.createSession(
            acceptorId, acceptorName,   // X
            inviterId,  inviterName     // O
        );
        log.info("[TTT] Ván mới: {} (X) vs {} (O) — id={}", acceptorName, inviterName, session.getGameId());
        // Broadcast trạng thái ban đầu cho cả 2 người
        TicTacToeResponse state = TicTacToeResponse.gameState(session);
        sendTo(session.getPlayerXId(), state);
        sendTo(session.getPlayerOId(), state);
    }

    // decline
    private void handleDecline(TicTacToeRequest req, String declinerId) {
        // gameId tạm = inviterId
        String inviterId = req.gameId();
        String declinerName = userRepository.findById(declinerId)
                .map(u -> u.getUsername()).orElse("Người dùng");
        log.info("[TTT] {} từ chối lời mời từ {}", declinerName, inviterId);
        sendTo(inviterId, TicTacToeResponse.declined(declinerName + " đã từ chối lời mời chơi cờ."));
    }

    // move
    private void handleMove(TicTacToeRequest req, String playerId) {
        TicTacToeSession session = sessionManager.findByGameId(req.gameId()).orElse(null);
        if (session == null) {
            sendTo(playerId, TicTacToeResponse.error("Không tìm thấy ván cờ."));
            return;
        }
        int row = req.row() != null ? req.row() : -1;
        int col = req.col() != null ? req.col() : -1;
        boolean valid = session.makeMove(playerId, row, col);
        if (!valid) {
            sendTo(playerId, TicTacToeResponse.error("Nước đi không hợp lệ."));
            return;
        }
        log.info("[TTT] Move [{}][{}] bởi {} — status={}", row, col, playerId, session.getStatus());
        TicTacToeResponse state = TicTacToeResponse.gameState(session);
        sendTo(session.getPlayerXId(), state);
        sendTo(session.getPlayerOId(), state);
        // Dọn dẹp RAM nếu ván đã xong
        if (session.getStatus() != TicTacToeSession.GameStatus.PLAYING) {
            sessionManager.removeSession(session.getGameId());
        }
    }

    // resign
    private void handleResign(TicTacToeRequest req, String playerId) {
        TicTacToeSession session = sessionManager.findByGameId(req.gameId()).orElse(null);
        if (session == null) return;
        session.resign(playerId);
        log.info("[TTT] {} đầu hàng — kết quả: {}", playerId, session.getStatus());
        TicTacToeResponse state = TicTacToeResponse.gameState(session);
        sendTo(session.getPlayerXId(), state);
        sendTo(session.getPlayerOId(), state);
        sessionManager.removeSession(session.getGameId());
    }

    private void sendTo(String userId, TicTacToeResponse response) {
        try {
            messagingTemplate.convertAndSendToUser(userId, QUEUE, response);
        } catch (Exception e) {
            log.error("[TTT] Gửi tới {} thất bại: {}", userId, e.getMessage());
        }
    }
}
