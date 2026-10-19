"use client";

import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";
import React, { useEffect, useRef } from "react";
import TypingIndicator from "./TypingIndicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationType } from "@/types";
import {
  formatMessageTime,
  formatFullDateTime,
  formatDateDivider,
  isDifferentDay,
} from "@/lib/date";

const EMPTY_TYPING_USERS: string[] = [];

export default function MessageList({ chatId }: { chatId: string }) {
  const { fetchMessages, messages, loadingMessages, conversations } =
    useChatStore();
  const currentUser = useUserStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === chatId);
  const chatMessages = messages[chatId] || [];

  const typingUsers =
    useChatStore((s) => s.typingUsers[chatId]) ?? EMPTY_TYPING_USERS;

  //tải tin nhắn khi mở phòng chat
  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId, fetchMessages]);

  //cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typingUsers]);

  if (loadingMessages && chatMessages.length === 0) {
    return (
      <div className="flex-1 p-4 flex justify-center items-center text-gray-500">
        Đang tải tin nhắn...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white">
      {chatMessages.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          Bắt đầu trò chuyện!
        </div>
      ) : (
        chatMessages.map((msg, index) => {
          const isMe = msg.senderId === currentUser?.userId;
          const prevMsg = index > 0 ? chatMessages[index - 1] : null;
          const showDateDivider =
            !prevMsg || isDifferentDay(prevMsg.createdAt, msg.createdAt);

          const avatarUrl =
            msg.senderAvatar ||
            (conversation?.conversationType === ConversationType.PRIVATE
              ? conversation.conversationAvatar
              : undefined);

          const timeStr = formatMessageTime(msg.createdAt);
          const fullTimeStr = formatFullDateTime(msg.createdAt);

          return (
            <React.Fragment key={msg.id || msg.tempId || index}>
              {showDateDivider && msg.createdAt && (
                <div className="flex justify-center my-2">
                  <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">
                    {formatDateDivider(msg.createdAt)}
                  </span>
                </div>
              )}
              <div
                className={`flex flex-col max-w-[70%] ${
                  isMe ? "self-end items-end" : "self-start items-start"
                }`}
              >
                {/* Header phía trên: tên người gửi (nếu là nhóm) & thời gian */}
                {(timeStr ||
                  (!isMe &&
                    conversation?.conversationType ===
                      ConversationType.GROUP)) && (
                  <div
                    className={`flex items-center gap-1.5 mb-1 px-1 ${
                      !isMe ? "ml-10" : ""
                    }`}
                  >
                    {conversation?.conversationType ===
                      ConversationType.GROUP &&
                      !isMe && (
                        <span className="text-xs text-gray-500 font-medium">
                          {msg.senderName}
                        </span>
                      )}
                    {timeStr && (
                      <span
                        title={fullTimeStr}
                        className="text-[11px] text-gray-400 select-none"
                      >
                        {timeStr}
                      </span>
                    )}
                  </div>
                )}

                {/* Bong bóng chat & Avatar */}
                <div className="flex gap-2 items-end">
                  {!isMe && (
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage
                        src={avatarUrl || undefined}
                        alt={msg.senderName}
                      />
                      <AvatarFallback className="bg-pink-100 text-pink-500 text-xs font-bold">
                        {msg.senderName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    title={fullTimeStr}
                    className={`rounded-2xl px-3.5 py-2.5 text-[15px] break-words ${
                      isMe
                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                        : "bg-gray-100 text-black"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })
      )}

      <TypingIndicator usernames={typingUsers} />

      {/* Element ẩn để cuộn xuống */}
      <div ref={bottomRef} />
    </div>
  );
}
