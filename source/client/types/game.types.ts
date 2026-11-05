// Trạng thái ván cờ từ server
export type TicTacToeStatus = 
  | "PLAYING"
  | "X_WON"
  | "O_WON"
  | "DRAW";

// Loại frame server gửi xuống
export type TicTacToeResponseType =
  | "INVITE_RECEIVED"
  | "DECLINED"
  | "GAME_STATE"
  | "ERROR";

export interface TicTacToeResponse {
  type: TicTacToeResponseType;

  // INVITE_RECEIVED
  inviterUserId?: string;
  inviterUsername?: string;

  // GAME_STATE & INVITE_RECEIVED (gameId tạm)
  gameId?: string;

  // GAME_STATE
  board?: string[][];         // "X", "O", " "
  currentTurnPlayerId?: string;
  status?: TicTacToeStatus;
  playerXId?: string;
  playerXName?: string;
  playerOId?: string;
  playerOName?: string;

  // ERROR / DECLINED
  message?: string;

  // Caro 5 ô bổ sung
  lastMoveRow?: number | null;
  lastMoveCol?: number | null;
  winningCells?: [number, number][] | null;
  boardSize?: number;
}

// Frame gửi lên server
export interface TicTacToeRequest {
  type: "INVITE" | "ACCEPT" | "DECLINE" | "MOVE" | "RESIGN";
  targetUserId?: string;
  targetUsername?: string;
  gameId?: string;
  row?: number;
  col?: number;
}
