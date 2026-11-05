"use client";

import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import type { TicTacToeGameState } from "@/store/useTicTacToeStore";

// ─── Props
interface Props {
  pendingInvite: {
    inviterUserId: string;
    inviterUsername: string;
    gameId: string;
  } | null;
  game: TicTacToeGameState | null;
  onAccept: (gameId: string) => void;
  onDecline: (gameId: string) => void;
  onMove: (gameId: string, row: number, col: number) => void;
  onResign: (gameId: string) => void;
  onClose: () => void;
}

// ─── Component
export default function TicTacToeModal({
  pendingInvite,
  game,
  onAccept,
  onDecline,
  onMove,
  onResign,
  onClose,
}: Props) {
  const currentUser = useUserStore((s) => s.user);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      {/* ── Màn hình lời mời thách đấu ─────────────────────────────────── */}
      {pendingInvite && !game && (
        <section className="w-80 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center gap-3">
            <div className="text-5xl">🎮</div>
            <h2 className="text-lg font-bold text-gray-900">
              Lời mời thách đấu!
            </h2>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-pink-600">
                {pendingInvite.inviterUsername}
              </span>{" "}
              đang mời bạn chơi cờ Tic-Tac-Toe 1-1
            </p>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onDecline(pendingInvite.gameId)}
            >
              Từ chối
            </Button>
            <Button
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-md shadow-pink-600/20"
              onClick={() => onAccept(pendingInvite.gameId)}
            >
              Chấp nhận
            </Button>
          </div>
        </section>
      )}

      {/* ── Màn hình bàn cờ 3x3 ────────────────────────────────────────── */}
      {game && (
        <section className="w-96 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <span className="font-bold text-lg text-gray-900">Tic-Tac-Toe</span>
            <StatusBadge
              game={game}
              currentUserId={currentUser?.userId ?? ""}
            />
          </div>

          {/* Player info */}
          <div className="flex justify-between items-center px-5 py-3 text-sm bg-gray-50 border-b border-gray-100">
            <span className="flex items-center gap-1.5 font-medium text-gray-800">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs">
                X
              </span>
              <span className="max-w-[110px] truncate">{game.playerXName}</span>
              {game.playerXId === currentUser?.userId && (
                <span className="text-xs text-gray-400 font-normal">(bạn)</span>
              )}
            </span>
            <span className="text-xs text-gray-400 font-bold tracking-wider">VS</span>
            <span className="flex items-center gap-1.5 font-medium text-gray-800">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-100 text-rose-600 font-bold text-xs">
                O
              </span>
              <span className="max-w-[110px] truncate">{game.playerOName}</span>
              {game.playerOId === currentUser?.userId && (
                <span className="text-xs text-gray-400 font-normal">(bạn)</span>
              )}
            </span>
          </div>

          {/* Board 3x3 */}
          <div className="grid grid-cols-3 gap-2.5 p-5 bg-gray-50/50">
            {game.board.map((row, ri) =>
              row.map((cell, ci) => {
                const isMyTurn =
                  game.currentTurnPlayerId === currentUser?.userId;
                const isPlaying = game.status === "PLAYING";
                const isCellEmpty = !cell || cell.trim() === "";
                const canClick = isMyTurn && isPlaying && isCellEmpty;

                return (
                  <button
                    key={`${ri}-${ci}`}
                    onClick={() => canClick && onMove(game.gameId, ri, ci)}
                    disabled={!canClick}
                    className={`
                      flex items-center justify-center
                      h-24 rounded-2xl border-2 text-4xl font-extrabold select-none
                      transition-all duration-150 shadow-xs
                      ${cell === "X" ? "text-blue-600 border-blue-200 bg-blue-50/80" : ""}
                      ${cell === "O" ? "text-rose-500 border-rose-200 bg-rose-50/80" : ""}
                      ${
                        isCellEmpty && canClick
                          ? "border-gray-200 bg-white hover:bg-pink-50 hover:border-pink-300 hover:scale-[1.02] cursor-pointer"
                          : isCellEmpty
                          ? "border-gray-100 bg-gray-100/60 cursor-not-allowed opacity-60"
                          : ""
                      }
                    `}
                  >
                    {!isCellEmpty ? cell : ""}
                  </button>
                );
              }),
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100">
            {game.status === "PLAYING" ? (
              <>
                <TurnIndicator
                  game={game}
                  currentUserId={currentUser?.userId ?? ""}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
                  onClick={() => onResign(game.gameId)}
                >
                  Đầu hàng
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-md shadow-pink-600/20 font-medium"
                onClick={onClose}
              >
                Đóng
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Sub-components
function StatusBadge({
  game,
  currentUserId,
}: {
  game: TicTacToeGameState;
  currentUserId: string;
}) {
  if (game.status === "PLAYING") {
    const isMeX = game.playerXId === currentUserId;
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-100 text-pink-700">
        Bạn là quân {isMeX ? "X (đi trước)" : "O (đi sau)"}
      </span>
    );
  }

  const isXWon = game.status === "X_WON";
  const isOWon = game.status === "O_WON";
  const isDraw = game.status === "DRAW";

  let label = "";
  let color = "";

  if (isDraw) {
    label = "🤝 Hòa!";
    color = "text-gray-700 bg-gray-100";
  } else {
    const winnerId = isXWon ? game.playerXId : game.playerOId;
    const winnerName = isXWon ? game.playerXName : game.playerOName;
    if (winnerId === currentUserId) {
      label = "🏆 Bạn thắng!";
      color = "text-emerald-700 bg-emerald-100";
    } else {
      label = `${winnerName} thắng!`;
      color = "text-rose-700 bg-rose-100";
    }
  }

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
      {label}
    </span>
  );
}

function TurnIndicator({
  game,
  currentUserId,
}: {
  game: TicTacToeGameState;
  currentUserId: string;
}) {
  const isMyTurn = game.currentTurnPlayerId === currentUserId;
  return (
    <span className="text-sm text-gray-600 self-center">
      {isMyTurn ? (
        <span className="text-pink-600 font-semibold animate-pulse">
          ✦ Đến lượt bạn!
        </span>
      ) : (
        <span className="text-gray-400">Đang chờ đối phương...</span>
      )}
    </span>
  );
}
