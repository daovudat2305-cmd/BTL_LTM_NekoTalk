package com.nekotalk.game;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Quản lý toàn bộ các ván Tic-Tac-Toe đang diễn ra trên RAM.
 * Dùng ConcurrentHashMap để thread-safe khi nhiều ván chạy đồng thời.
 */
@Component
public class TicTacToeSessionManager {

    //gameId => van co
    private final Map<String,TicTacToeSession> sessions = new ConcurrentHashMap<>();
    //userId, gameId
    private final Map<String,String> playerToGame = new ConcurrentHashMap<>(); 

    public TicTacToeSession createSession(String playerXId, String playerXName, String playerOId, String playerOName) {
        TicTacToeSession session = new TicTacToeSession(playerXId, playerXName, playerOId, playerOName);

        sessions.put(session.getGameId(), session);
        playerToGame.put(playerXId, session.getGameId());
        playerToGame.put(playerOId, session.getGameId());
        return session;
    }

    public Optional<TicTacToeSession> findByGameId(String gameId) {
        return Optional.ofNullable(sessions.get(gameId));
    }

    public Optional<TicTacToeSession> findByPlayerId(String userId) {
        String gameId = playerToGame.get(userId);
        if (gameId == null) return Optional.empty();
        return Optional.ofNullable(sessions.get(gameId));
    }

    public boolean isPlayerInGame(String userId) {
        return playerToGame.containsKey(userId);
    }

    public void removeSession(String gameId) {
        TicTacToeSession session = sessions.remove(gameId);
        if(session != null) {
            playerToGame.remove(session.getPlayerXId());
            playerToGame.remove(session.getPlayerOId());
        }
    }
}
