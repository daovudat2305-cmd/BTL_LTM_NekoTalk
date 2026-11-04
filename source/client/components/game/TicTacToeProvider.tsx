"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useChatStore } from "@/store/useChatStore";
import { useTicTacToeStore } from "@/store/useTicTacToeStore";
import type { TicTacToeRequest } from "@/types/game.types";
import TicTacToeModal from "./TicTacToeModal";

// ─── Context ────────────────────────────────────────────────────────────────
interface TicTacToeContextValue {
  /**
   * Gửi lời mời chơi đến một người dùng.
   * Gọi hàm này từ bất kỳ component nào đã bọc trong TicTacToeProvider.
   */
  inviteToGame: (targetUserId: string, targetUsername: string) => void;
}

const TicTacToeContext = createContext<TicTacToeContextValue | null>(null);

export function useTicTacToe() {
  const ctx = useContext(TicTacToeContext);
  if (!ctx)
    throw new Error("useTicTacToe must be used within TicTacToeProvider");
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────
export default function TicTacToeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const stompClient = useChatStore((s) => s.stompClient);

  // Helper publish WebSocket
  const publish = useCallback(
    (req: TicTacToeRequest) => {
      if (!stompClient?.connected) {
        toast.error("Mất kết nối máy chủ.");
        return;
      }
      stompClient.publish({
        destination: "/app/game.ttt",
        body: JSON.stringify({
          row: req.row ?? 0,
          col: req.col ?? 0,
          ...req,
        }),
      });
    },
    [stompClient],
  );

  // Mời người khác chơi
  const inviteToGame = useCallback(
    (targetUserId: string, targetUsername: string) => {
      if (!targetUserId) {
        toast.error("Không tìm thấy thông tin đối phương để thách đấu.");
        return;
      }
      publish({ type: "INVITE", targetUserId, targetUsername });
      toast.info(`Đã gửi lời mời thách đấu tới ${targetUsername}!`);
    },
    [publish],
  );

  return (
    <TicTacToeContext.Provider value={{ inviteToGame }}>
      {children}
      {/* Modal game được import và render ở đây */}
      <TicTacToeModalContainer publish={publish} />
    </TicTacToeContext.Provider>
  );
}

function TicTacToeModalContainer({
  publish,
}: {
  publish: (req: TicTacToeRequest) => void;
}) {
  const { pendingInvite, game, notification } = useTicTacToeStore();
  const clearGame = useTicTacToeStore((s) => s.clearGame);

  // Hiện toast khi có notification
  useEffect(() => {
    if (notification) toast.info(notification);
  }, [notification]);

  if (!pendingInvite && !game) return null;

  return (
    <TicTacToeModal
      pendingInvite={pendingInvite}
      game={game}
      onAccept={(gameId) => publish({ type: "ACCEPT", gameId })}
      onDecline={(gameId) => {
        publish({ type: "DECLINE", gameId });
        clearGame();
      }}
      onMove={(gameId, row, col) =>
        publish({ type: "MOVE", gameId, row, col })
      }
      onResign={(gameId) => {
        publish({ type: "RESIGN", gameId });
      }}
      onClose={clearGame}
    />
  );
}
