package com.nekotalk.game;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class TicTacToeSession {

    public enum GameStatus {WAITING, PLAYING, X_WON, O_WON, DRAW}

    public static final int BOARD_SIZE = 15;
    public static final int WIN_COUNT = 5;

    private final String gameId;

    // playerX = người được mời (đi trước), playerO = người thách đấu
    private final String playerXId;
    private final String playerXName;
    private final String playerOId;
    private final String playerOName;

    private final char[][] board;
    private char currentTurn; // 'X' | 'O'
    private GameStatus status;
    private int moveCount;
    private int lastMoveRow = -1;
    private int lastMoveCol = -1;
    private int[][] winningCells = null;

    public TicTacToeSession(String playerXId, String playerXName, String playerOId, String playerOName) {
        this.gameId = UUID.randomUUID().toString();
        this.playerXId = playerXId;
        this.playerXName = playerXName;
        this.playerOId = playerOId;
        this.playerOName = playerOName;
        this.board = new char[BOARD_SIZE][BOARD_SIZE];
        this.currentTurn = 'X';
        this.status = GameStatus.PLAYING;
        this.moveCount = 0;
        this.lastMoveRow = -1;
        this.lastMoveCol = -1;
        this.winningCells = null;

        // Khởi tạo các ô trống
        for (int i = 0; i < BOARD_SIZE; i++) {
            for (int j = 0; j < BOARD_SIZE; j++) {
                board[i][j] = ' ';
            }
        }
    }

    /**
     * Thực hiện một nước đi. Thread-safe.
     * @return true nếu nước đi hợp lệ và đã được áp dụng.
     */
    public synchronized boolean makeMove(String playerId, int row, int col) {
        if (status != GameStatus.PLAYING) return false;
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;
        if (board[row][col] != ' ') return false;

        char symbol = getSymbol(playerId);
        if (symbol == '\0') return false;
        if (symbol != currentTurn) return false;

        board[row][col] = symbol;
        lastMoveRow = row;
        lastMoveCol = col;
        moveCount++;

        if (checkWin(row, col, symbol)) {
            status = (symbol == 'X') ? GameStatus.X_WON : GameStatus.O_WON;
        } else if (isBoardFull()) {
            status = GameStatus.DRAW;
        } else {
            currentTurn = (currentTurn == 'X') ? 'O' : 'X';
        }
        return true;
    }

    // Đầu hàng
    public synchronized void resign(String playerId) {
        if (status != GameStatus.PLAYING) return;
        char symbol = getSymbol(playerId);
        status = (symbol == 'X') ? GameStatus.O_WON : GameStatus.X_WON;
    }

    // Helper
    private char getSymbol(String playerId) {
        if (playerXId.equals(playerId)) return 'X';
        if (playerOId.equals(playerId)) return 'O';
        return '\0';
    }

    /**
     * Kiểm tra thắng theo 4 hướng lan từ nước đi (r, c) mới nhất:
     * 1. Hàng ngang (dr=0, dc=1)
     * 2. Hàng dọc (dr=1, dc=0)
     * 3. Chéo chính \ (dr=1, dc=1)
     * 4. Chéo phụ / (dr=1, dc=-1)
     */
    private boolean checkWin(int r, int c, char symbol) {
        int[][] directions = {
            {0, 1},   // Ngang
            {1, 0},   // Dọc
            {1, 1},   // Chéo chính
            {1, -1}   // Chéo phụ
        };

        for (int[] dir : directions) {
            int dr = dir[0];
            int dc = dir[1];
            List<int[]> line = new ArrayList<>();
            line.add(new int[]{r, c});

            // Lan theo chiều dương
            int step = 1;
            while (true) {
                int nr = r + step * dr;
                int nc = c + step * dc;
                if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] != symbol) {
                    break;
                }
                line.add(new int[]{nr, nc});
                step++;
            }

            // Lan theo chiều âm
            step = 1;
            while (true) {
                int nr = r - step * dr;
                int nc = c - step * dc;
                if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] != symbol) {
                    break;
                }
                line.add(new int[]{nr, nc});
                step++;
            }

            if (line.size() >= WIN_COUNT) {
                winningCells = line.toArray(new int[0][0]);
                return true;
            }
        }

        return false;
    }

    private boolean isBoardFull() {
        return moveCount >= BOARD_SIZE * BOARD_SIZE;
    }

    // Getters 
    public String getGameId()         { return gameId; }
    public String getPlayerXId()      { return playerXId; }
    public String getPlayerXName()    { return playerXName; }
    public String getPlayerOId()      { return playerOId; }
    public String getPlayerOName()    { return playerOName; }
    public char[][] getBoard()        { return board; }
    public char getCurrentTurn()      { return currentTurn; }
    public GameStatus getStatus()     { return status; }
    public int getLastMoveRow()       { return lastMoveRow; }
    public int getLastMoveCol()       { return lastMoveCol; }
    public int[][] getWinningCells()  { return winningCells; }
    public int getBoardSize()         { return BOARD_SIZE; }

    public boolean isPlayer(String userId) {
        return playerXId.equals(userId) || playerOId.equals(userId);
    } 
}
