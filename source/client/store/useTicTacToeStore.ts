import { create } from "zustand";
import type { TicTacToeResponse, TicTacToeStatus } from "@/types/game.types";

export interface TicTacToeGameState {
  gameId: string;
  board: string[][]; // 3x3 — "X" | "O" | " "
  currentTurnPlayerId: string;
  status: TicTacToeStatus;
  playerXId: string;
  playerXName: string;
  playerOId: string;
  playerOName: string;
}

// Chuyển đổi dữ liệu board từ server (dù là char[][] dạng string[] hay string[][]) về mảng 3x3 chuẩn
function normalizeBoard(rawBoard?: unknown): string[][] {
  const emptyBoard: string[][] = [
    [" ", " ", " "],
    [" ", " ", " "],
    [" ", " ", " "],
  ];
  if (!rawBoard) return emptyBoard;

  if (Array.isArray(rawBoard)) {
    return rawBoard.map((row) => {
      if (typeof row === "string") {
        const chars = row.split("");
        while (chars.length < 3) chars.push(" ");
        return chars.slice(0, 3);
      }
      if (Array.isArray(row)) {
        const cells = row.map((c) => (c && String(c).trim() ? String(c) : " "));
        while (cells.length < 3) cells.push(" ");
        return cells.slice(0, 3);
      }
      return [" ", " ", " "];
    });
  }

  return emptyBoard;
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

      case "GAME_STATE":
        set({
          pendingInvite: null,
          game: {
            gameId: res.gameId!,
            board: normalizeBoard(res.board),
            currentTurnPlayerId: res.currentTurnPlayerId!,
            status: res.status!,
            playerXId: res.playerXId!,
            playerXName: res.playerXName!,
            playerOId: res.playerOId!,
            playerOName: res.playerOName!,
          },
        });
        break;

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
