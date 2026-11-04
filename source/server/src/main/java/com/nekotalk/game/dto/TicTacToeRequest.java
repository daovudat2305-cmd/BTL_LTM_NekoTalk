package com.nekotalk.game.dto;

/**
 * DTO nhận từ client qua WebSocket STOMP.
 * type: INVITE | ACCEPT | DECLINE | MOVE | RESIGN
 */
public record TicTacToeRequest(
    String type,         // Loại hành động
    String targetUserId, // Dùng khi type = INVITE
    String targetUsername,
    String gameId,       // Dùng khi type = ACCEPT | DECLINE | MOVE | RESIGN
    Integer row,         // Dùng khi type = MOVE (dùng Integer để tránh lỗi parse null)
    Integer col          // Dùng khi type = MOVE (dùng Integer để tránh lỗi parse null)
) {}
