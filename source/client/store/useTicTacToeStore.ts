import { create } from "zustand";
import type { TicTacToeResponse, TicTacToeStatus } from "@/types/game.types";

export interface TicTacToeGameState {
  gameId: string;
  board: string[][]; // ma trận kích thước boardSize x boardSize — "X" | "O" | " "
  boardSize: number;
  currentTurnPlayerId: string;
  status: TicTacToeStatus;
  playerXId: string;
  playerXName: string;
  playerOId: string;
  playerOName: string;
  lastMove?: { row: number; col: number } | null;
  winningCells?: [number, number][] | null;
}

// Chuyển đổi dữ liệu board từ server (char[][] dạng string[] hoặc string[][]) về mảng kích thước chuẩn
function normalizeBoard(rawBoard?: unknown, size = 15): string[][] {
  const createEmptyRow = () => Array(size).fill(" ");
  const emptyBoard: string[][] = Array.from({ length: size }, () => createEmptyRow());

  if (!rawBoard || !Array.isArray(rawBoard)) {
    return emptyBoard;
  }

  const result: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row = rawBoard[r];
    if (typeof row === "string") {
      const chars = row.split("");
      while (chars.length < size) chars.push(" ");
      result.push(chars.slice(0, size));
    } else if (Array.isArray(row)) {
      const cells = row.map((c) => (c && String(c).trim() ? String(c) : " "));
      while (cells.length < size) cells.push(" ");
      result.push(cells.slice(0, size));
    } else {
      result.push(createEmptyRow());
    }
  }

  return result;
}

interface TicTacToeStoreState {
  // Lời mời đang chờ phản hồi
  pendingInvite: {
    inviterUserId: string;
    inviterUsername: string;
    gameId: string; // = inviterId (dùng để ACCEPT/DECLINE)
  } | null;

  // Ván cờ đang chơi
  game: TicTacToeGameState | null;

  // Thông báo ngắn (declined, error) — tự biến mất sau 3s
  notification: string | null;

  // Actions
  handleServerResponse: (response: TicTacToeResponse) => void;
  clearGame: () => void;
  clearNotification: () => void;
}

export const useTicTacToeStore = create<TicTacToeStoreState>((set) => ({
  pendingInvite: null,
  game: null,
  notification: null,

  handleServerResponse: (res) => {
    switch (res.type) {
      case "INVITE_RECEIVED":
        set({
          pendingInvite: {
            inviterUserId: res.inviterUserId!,
            inviterUsername: res.inviterUsername!,
            gameId: res.gameId!,
          },
        });
        break;

      case "GAME_STATE": {
        const boardSize = res.boardSize ?? 15;
        const lastMove =
          res.lastMoveRow != null && res.lastMoveCol != null
            ? { row: res.lastMoveRow, col: res.lastMoveCol }
            : null;

        set({
          pendingInvite: null,
          game: {
            gameId: res.gameId!,
            board: normalizeBoard(res.board, boardSize),
            boardSize,
            currentTurnPlayerId: res.currentTurnPlayerId!,
            status: res.status!,
            playerXId: res.playerXId!,
            playerXName: res.playerXName!,
            playerOId: res.playerOId!,
            playerOName: res.playerOName!,
            lastMove,
            winningCells: res.winningCells ?? null,
          },
        });
        break;
      }

      case "DECLINED":
      case "ERROR":
        set({ notification: res.message ?? "Có lỗi xảy ra." });
        // Tự xóa notification sau 3 giây
        setTimeout(() => set({ notification: null }), 3000);
        break;
    }
  },

  clearGame: () => set({ game: null, pendingInvite: null }),
  clearNotification: () => set({ notification: null }),
}));
