package com.nekotalk.game.dto;

import com.nekotalk.game.TicTacToeSession;
import com.nekotalk.game.TicTacToeSession.GameStatus;

public record TicTacToeResponse (
    String type,

    String inviterUserId,
    String inviterUsername,
    String gameId,

    //trang thai ban co
    char[][] board,
    String currentTurnPlayerId,
    GameStatus status,
    String playerXId,
    String playerXName,
    String playerOId,
    String playerOName,

    // thong bao loi (type = ERROR) ---
    String message
) {
    
    // moi thach dau
    public static TicTacToeResponse invite(String inviterUserId, String inviterUsername, String gameId) {
        return new TicTacToeResponse("INVITE_RECEIVED",
            inviterUserId, inviterUsername, gameId,
            null, null, null, null, null, null, null, null);
    }

    //tu choi
    public static TicTacToeResponse declined(String message) {
        return new TicTacToeResponse("DECLINED",
            null, null, null,
            null, null, null, null, null, null, null, message);
    }

    //trang thai sau makeMove
    public static TicTacToeResponse gameState(TicTacToeSession session) {
        String currentTurnPlayerId = session.getCurrentTurn() == 'X'
                ? session.getPlayerXId() : session.getPlayerOId();
        return new TicTacToeResponse("GAME_STATE",
            null, null, session.getGameId(),
            session.getBoard(), currentTurnPlayerId, session.getStatus(),
            session.getPlayerXId(), session.getPlayerXName(),
            session.getPlayerOId(), session.getPlayerOName(), null);
    }

    // loi
    public static TicTacToeResponse error(String message) {
        return new TicTacToeResponse("ERROR",
            null, null, null,
            null, null, null, null, null, null, null, message);
    }
}
