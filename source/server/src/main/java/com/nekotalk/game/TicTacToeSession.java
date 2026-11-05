package com.nekotalk.game;

import java.util.UUID;

public class TicTacToeSession {

    public enum GameStatus {WAITING, PLAYING, X_WON, O_WON, DRAW}

    private final String gameId;

    //playerX = nguoi duoc moi (di truoc), playerO = nguoi thach dau
    private final String playerXId;
    private final String playerXName;
    private final String playerOId;
    private final String playerOName;

    private char[][] board;
    private char currentTurn; // X , O
    private GameStatus status;

    public TicTacToeSession(String playerXId, String playerXName, String playerOId, String playerOName) {
        this.gameId = UUID.randomUUID().toString();
        this.playerXId = playerXId;
        this.playerXName = playerXName;
        this.playerOId = playerOId;
        this.playerOName = playerOName;
        this.board       = new char[3][3];
        this.currentTurn = 'X';
        this.status      = GameStatus.PLAYING;
        // Khởi tạo 9 ô trống
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                board[i][j] = ' ';
    }

     /**
     * Thực hiện một nước đi. Thread-safe.
     * @return true nếu nước đi hợp lệ và đã được áp dụng.
     */
    public synchronized boolean makeMove(String playerId, int row, int col) {
        if(status != GameStatus.PLAYING) return false;
        if(row < 0 || row > 2 || col < 0 || col > 2) return false;
        if(board[row][col] != ' ') return false;

        char symbol = getSymbol(playerId);
        if(symbol == '\0') return false;
        if(symbol != currentTurn) return false;

        board[row][col] = symbol;

        if (checkWin(symbol)) {
            status = (symbol == 'X') ? GameStatus.X_WON : GameStatus.O_WON;
        } else if (isBoardFull()) {
            status = GameStatus.DRAW;
        } else {
            currentTurn = (currentTurn == 'X') ? 'O' : 'X';
        }
        return true;
    }


    //dau hang
    public synchronized void resign(String playerId) {
        if(status != GameStatus.PLAYING) return;
        char symbol = getSymbol(playerId);
        status = (symbol == 'X') ? GameStatus.O_WON : GameStatus.X_WON;
    }

    // Helper
    private char getSymbol(String playerId) {
        if (playerXId.equals(playerId)) return 'X';
        if (playerOId.equals(playerId)) return 'O';
        return '\0';
    }

    private boolean checkWin(char s) {
        for(int i=0; i<3; i++) {
            if (board[i][0] == s && board[i][1] == s && board[i][2] == s) return true;
            if (board[0][i] == s && board[1][i] == s && board[2][i] == s) return true;
        }
        if (board[0][0] == s && board[1][1] == s && board[2][2] == s) return true;
        return board[0][2] == s && board[1][1] == s && board[2][0] == s;
    }

    private boolean isBoardFull() {
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                if (board[i][j] == ' ') return false;
        return true;
    }

    //  Getters 
    public String getGameId()      { return gameId; }
    public String getPlayerXId()   { return playerXId; }
    public String getPlayerXName() { return playerXName; }
    public String getPlayerOId()   { return playerOId; }
    public String getPlayerOName() { return playerOName; }
    public char[][] getBoard()     { return board; }
    public char getCurrentTurn()   { return currentTurn; }
    public GameStatus getStatus()  { return status; }

    public boolean isPlayer(String userId) {
        return playerXId.equals(userId) || playerOId.equals(userId);
    } 
}
