"use client";

import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";
import { useEffect, useRef } from "react";
import TypingIndicator from "./TypingIndicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationType } from "@/types";

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

  console.log("[MessageList] chatId đang xem:", chatId);
  console.log("[MessageList] số tin nhắn trong cache:", chatMessages.length);
  console.log(
    "[MessageList] tất cả keys trong messages store:",
    Object.keys(messages),
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white">
      {chatMessages.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          Bắt đầu trò chuyện!
        </div>
      ) : (
        chatMessages.map((msg) => {
          const isMe = msg.senderId === currentUser?.userId;
          const avatarUrl =
            msg.senderAvatar ||
            (conversation?.conversationType === ConversationType.PRIVATE
              ? conversation.conversationAvatar
              : undefined);

          return (
            <div
              key={msg.id || msg.tempId}
              className={`flex gap-2 max-w-[70%] ${isMe ? "self-end" : "self-start"}`}
            >
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
                className={`rounded-2xl p-3 text-[15px] ${isMe ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white" : "bg-gray-100 text-black"}`}
              >
                {msg.content}
              </div>
            </div>
          );
        })
      )}

      <TypingIndicator usernames={typingUsers} />

      {/* Element ẩn để cuộn xuống */}
      <div ref={bottomRef} />
    </div>
  );
}
