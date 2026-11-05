package com.nekotalk.game.dto;

import com.nekotalk.game.TicTacToeSession;
import com.nekotalk.game.TicTacToeSession.GameStatus;

public record TicTacToeResponse (
    String type,

    String inviterUserId,
    String inviterUsername,
    String gameId,

    // trang thai ban co
    char[][] board,
    String currentTurnPlayerId,
    GameStatus status,
    String playerXId,
    String playerXName,
    String playerOId,
    String playerOName,

    // thong bao loi (type = ERROR)
    String message,

    // Thong tin bo sung cho Caro 5 o
    Integer lastMoveRow,
    Integer lastMoveCol,
    int[][] winningCells,
    Integer boardSize
) {
    
    // moi thach dau
    public static TicTacToeResponse invite(String inviterUserId, String inviterUsername, String gameId) {
        return new TicTacToeResponse("INVITE_RECEIVED",
            inviterUserId, inviterUsername, gameId,
            null, null, null, null, null, null, null, null,
            null, null, null, TicTacToeSession.BOARD_SIZE);
    }

    // tu choi
    public static TicTacToeResponse declined(String message) {
        return new TicTacToeResponse("DECLINED",
            null, null, null,
            null, null, null, null, null, null, null, message,
            null, null, null, null);
    }

    // trang thai sau makeMove / accept
    public static TicTacToeResponse gameState(TicTacToeSession session) {
        String currentTurnPlayerId = session.getCurrentTurn() == 'X'
                ? session.getPlayerXId() : session.getPlayerOId();
        return new TicTacToeResponse("GAME_STATE",
            null, null, session.getGameId(),
            session.getBoard(), currentTurnPlayerId, session.getStatus(),
            session.getPlayerXId(), session.getPlayerXName(),
            session.getPlayerOId(), session.getPlayerOName(), null,
            session.getLastMoveRow() >= 0 ? session.getLastMoveRow() : null,
            session.getLastMoveCol() >= 0 ? session.getLastMoveCol() : null,
            session.getWinningCells(),
            session.getBoardSize());
    }

    // loi
    public static TicTacToeResponse error(String message) {
        return new TicTacToeResponse("ERROR",
            null, null, null,
            null, null, null, null, null, null, null, message,
            null, null, null, null);
    }
}
