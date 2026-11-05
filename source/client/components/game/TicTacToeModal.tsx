"use client";

import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import type { TicTacToeGameState } from "@/store/useTicTacToeStore";
import {
  X,
  Circle,
  Swords,
  Trophy,
  Handshake,
  Flag,
  Sparkles,
  Check,
  Ban,
  Gamepad2,
  Clock,
  Info,
} from "lucide-react";

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

  const currentUserSymbol =
    currentUser?.userId === game?.playerXId
      ? "X"
      : currentUser?.userId === game?.playerOId
      ? "O"
      : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* ── Màn hình lời mời thách đấu ─────────────────────────────────── */}
      {pendingInvite && !game && (
        <section className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center px-8 pt-9 pb-6 text-center gap-4">
            <div className="w-18 h-18 rounded-3xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shadow-inner">
              <Swords className="w-9 h-9 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Thách đấu Cờ Caro 1-1!
              </h2>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                <span className="font-semibold text-pink-600">
                  {pendingInvite.inviterUsername}
                </span>{" "}
                đang thách đấu bạn một ván cờ Caro 15×15 (5 ô thẳng hàng để thắng).
              </p>
            </div>
          </div>
          <div className="flex gap-3 px-8 pb-8">
            <Button
              variant="outline"
              className="flex-1 py-5 rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-50 text-base font-medium"
              onClick={() => onDecline(pendingInvite.gameId)}
            >
              <Ban className="w-5 h-5 mr-2 text-gray-500" />
              Từ chối
            </Button>
            <Button
              className="flex-1 py-5 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl shadow-md shadow-pink-600/25 text-base font-semibold"
              onClick={() => onAccept(pendingInvite.gameId)}
            >
              <Check className="w-5 h-5 mr-2" />
              Chấp nhận
            </Button>
          </div>
        </section>
      )}

      {/* ── Màn hình bàn cờ Caro dạng hình chữ nhật cho màn hình PC ───── */}
      {game && (
        <section className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
          {/* Nút đóng góc phải */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
            aria-label="Đóng bàn cờ"
            title="Đóng bàn cờ"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* ─── Cột Trái: Bàn cờ Caro 15x15 to, rõ ràng ─── */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50/80 border-b md:border-b-0 md:border-r border-gray-100 overflow-auto">
            {/* Khung bàn cờ */}
            <div
              className="grid gap-[2px] bg-slate-300 p-[3px] rounded-2xl shadow-md select-none w-full max-w-[550px] aspect-square"
              style={{
                gridTemplateColumns: `repeat(${game.boardSize || 15}, minmax(0, 1fr))`,
              }}
            >
              {game.board.map((row, ri) =>
                row.map((cell, ci) => {
                  const isMyTurn =
                    game.currentTurnPlayerId === currentUser?.userId;
                  const isPlaying = game.status === "PLAYING";
                  const isCellEmpty = !cell || cell.trim() === "";
                  const canClick = isMyTurn && isPlaying && isCellEmpty;

                  // Kiểm tra ô thắng
                  const isWinning = Boolean(
                    game.winningCells?.some(
                      ([wr, wc]) => wr === ri && wc === ci
                    )
                  );

                  // Kiểm tra nước đi gần nhất
                  const isLast = Boolean(
                    game.lastMove &&
                      game.lastMove.row === ri &&
                      game.lastMove.col === ci
                  );

                  return (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      onClick={() => canClick && onMove(game.gameId, ri, ci)}
                      disabled={!canClick}
                      className={`
                        relative group flex items-center justify-center aspect-square
                        rounded-xs transition-all duration-150 text-center
                        ${
                          isWinning
                            ? "bg-emerald-200 ring-2 ring-emerald-500 z-10 animate-pulse scale-[1.03]"
                            : isLast
                            ? "bg-pink-50 ring-2 ring-pink-500 z-1"
                            : "bg-white"
                        }
                        ${
                          isCellEmpty && canClick
                            ? "hover:bg-pink-50/80 hover:scale-[1.04] cursor-pointer shadow-xs"
                            : isCellEmpty
                            ? "cursor-not-allowed opacity-90"
                            : ""
                        }
                      `}
                    >
                      {/* Quân X (To, nét dày) */}
                      {cell === "X" && (
                        <X
                          className={`w-4.5 h-4.5 sm:w-5 sm:h-5 lg:w-5.5 lg:h-5.5 stroke-[3.5] transition-transform ${
                            isWinning
                              ? "text-emerald-900 scale-110"
                              : "text-blue-600 scale-100"
                          }`}
                        />
                      )}

                      {/* Quân O (To, nét dày) */}
                      {cell === "O" && (
                        <Circle
                          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 stroke-[3.5] transition-transform ${
                            isWinning
                              ? "text-emerald-900 scale-110"
                              : "text-rose-500 scale-100"
                          }`}
                        />
                      )}

                      {/* Ghost preview khi hover đến lượt đi */}
                      {isCellEmpty && canClick && (
                        <span className="opacity-0 group-hover:opacity-40 transition-opacity">
                          {currentUserSymbol === "X" ? (
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 stroke-[3]" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-rose-400 stroke-[3]" />
                          )}
                        </span>
                      )}

                      {/* Last Move Indicator (Chấm hồng nhấp nháy góc phải) */}
                      {isLast && !isWinning && (
                        <>
                          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-pink-500" />
                        </>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
          </div>

          {/* ─── Cột Phải: Bảng điều khiển trận đấu & Thông tin người chơi ─── */}
          <div className="w-full md:w-[340px] lg:w-[370px] shrink-0 p-5 sm:p-6 flex flex-col justify-between bg-white overflow-y-auto">
            {/* Header thông tin game */}
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-bold text-lg text-gray-900 truncate leading-tight">
                    Cờ Caro 1-1
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Info className="w-3.5 h-3.5 text-pink-500" />
                    5 ô thẳng hàng để thắng
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                <StatusBadge
                  game={game}
                  currentUserId={currentUser?.userId ?? ""}
                />
              </div>

              {/* Player Cards */}
              <div className="mt-5 space-y-2.5">
                {/* Thẻ Player X */}
                <div
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    game.currentTurnPlayerId === game.playerXId && game.status === "PLAYING"
                      ? "border-blue-300 bg-blue-50/70 shadow-sm ring-2 ring-blue-400/30"
                      : "border-gray-100 bg-gray-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-base shrink-0 shadow-xs">
                      <X className="w-5 h-5 stroke-[3.5]" />
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {game.playerXName}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Quân X (Đi trước)
                        {game.playerXId === currentUser?.userId && (
                          <span className="text-blue-600 font-semibold ml-1">
                            • Bạn
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {game.currentTurnPlayerId === game.playerXId && game.status === "PLAYING" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 animate-pulse shrink-0">
                      Đang đi
                    </span>
                  )}
                </div>

                {/* Huy hiệu VS */}
                <div className="flex items-center justify-center">
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                    VS
                  </span>
                </div>

                {/* Thẻ Player O */}
                <div
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    game.currentTurnPlayerId === game.playerOId && game.status === "PLAYING"
                      ? "border-rose-300 bg-rose-50/70 shadow-sm ring-2 ring-rose-400/30"
                      : "border-gray-100 bg-gray-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 text-rose-600 font-extrabold text-base shrink-0 shadow-xs">
                      <Circle className="w-4.5 h-4.5 stroke-[3.5]" />
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {game.playerOName}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Quân O (Đi sau)
                        {game.playerOId === currentUser?.userId && (
                          <span className="text-rose-600 font-semibold ml-1">
                            • Bạn
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {game.currentTurnPlayerId === game.playerOId && game.status === "PLAYING" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 animate-pulse shrink-0">
                      Đang đi
                    </span>
                  )}
                </div>
              </div>

              {/* Turn Status Box (To, rõ ràng) */}
              <div className="mt-5">
                <TurnBox
                  game={game}
                  currentUserId={currentUser?.userId ?? ""}
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
              {game.status === "PLAYING" ? (
                <Button
                  variant="outline"
                  className="w-full py-4 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-2xl font-semibold text-sm transition"
                  onClick={() => onResign(game.gameId)}
                >
                  <Flag className="w-4 h-4 mr-2 text-rose-500" />
                  Đầu hàng
                </Button>
              ) : (
                <Button
                  className="w-full py-5 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-semibold text-base shadow-md shadow-pink-600/20"
                  onClick={onClose}
                >
                  Đóng bàn cờ
                </Button>
              )}
            </div>
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
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-pink-50 text-pink-700 border border-pink-100 text-xs font-medium">
        <Sparkles className="w-4 h-4 text-pink-600 shrink-0" />
        <span>
          Bạn đang cầm quân{" "}
          <strong className="font-bold underline">
            {isMeX ? "X (Đi trước)" : "O (Đi sau)"}
          </strong>
        </span>
      </div>
    );
  }

  const isXWon = game.status === "X_WON";
  const isOWon = game.status === "O_WON";
  const isDraw = game.status === "DRAW";

  if (isDraw) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-2xl text-gray-800 bg-gray-100 border border-gray-200 text-sm font-bold">
        <Handshake className="w-5 h-5 text-gray-500 shrink-0" />
        <span>Ván cờ kết thúc với tỉ số Hòa!</span>
      </div>
    );
  }

  const winnerId = isXWon ? game.playerXId : game.playerOId;
  const winnerName = isXWon ? game.playerXName : game.playerOName;
  const isMeWinner = winnerId === currentUserId;

  return (
    <div
      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-sm font-bold ${
        isMeWinner
          ? "text-emerald-800 bg-emerald-50 border-emerald-300"
          : "text-rose-800 bg-rose-50 border-rose-300"
      }`}
    >
      <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
      <span>{isMeWinner ? "Chúc mừng! Bạn đã giành chiến thắng! 🏆" : `${winnerName} đã giành chiến thắng!`}</span>
    </div>
  );
}

function TurnBox({
  game,
  currentUserId,
}: {
  game: TicTacToeGameState;
  currentUserId: string;
}) {
  if (game.status !== "PLAYING") {
    return (
      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500">
        Ván cờ đã kết thúc. Bạn có thể đóng bàn cờ hoặc thách đấu lại.
      </div>
    );
  }

  const isMyTurn = game.currentTurnPlayerId === currentUserId;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isMyTurn
          ? "bg-pink-50/90 border-pink-300 shadow-sm ring-2 ring-pink-500/20"
          : "bg-gray-50 border-gray-100"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isMyTurn ? (
          <>
            <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 animate-bounce">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-pink-700 leading-tight">
                Đến lượt bạn đánh!
              </p>
              <p className="text-[11px] text-pink-600/80 mt-0.5">
                Nhấp vào ô trống trên bàn cờ để đặt quân
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-lg bg-gray-200/80 text-gray-500 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 leading-tight">
                Chờ đối thủ đi nước cờ...
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Đối phương đang tính toán thế cờ
              </p>
            </div>
          </>
        )}
      </div>

      {/* Hiển thị tọa độ nước đi gần nhất nếu có */}
      {game.lastMove && (
        <div className="mt-3 pt-2.5 border-t border-gray-200/50 flex justify-between text-[11px] text-gray-500">
          <span>Nước đi gần nhất:</span>
          <span className="font-semibold text-gray-700">
            Hàng {game.lastMove.row + 1}, Cột {game.lastMove.col + 1}
          </span>
        </div>
      )}
    </div>
  );
}
