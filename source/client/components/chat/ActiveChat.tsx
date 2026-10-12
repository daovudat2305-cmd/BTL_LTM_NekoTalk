"use client";

import { Phone, Video, Info } from "lucide-react";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";
import { ConversationType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export default function ActiveChat({ chatId }: { chatId: string }) {
  const { conversations } = useChatStore();
  const currentUser = useUserStore((s) => s.user);

  // cuộc trò chuyện hiện tại
  const conversation = conversations.find((c) => c.id === chatId);

  //thông tin hiện tại
  let chatName = "Đang tải...";
  let avatarUrl: string | undefined = undefined;

  if (conversation) {
    if (conversation.conversationType === ConversationType.GROUP) {
      chatName = conversation.name || "Nhóm trò chuyện";
      avatarUrl = conversation.conversationAvatar || undefined;
    } else {
      const partner = conversation.participantInfo?.find(
        (p) => p.userId !== currentUser?.userId,
      );
      chatName = partner ? partner.username : "Người dùng";
      avatarUrl = conversation.conversationAvatar || undefined;
    }
  }

  const initials = chatName.substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header của đoạn chat */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
          <Avatar size="lg" className="border border-border">
            <AvatarImage src={avatarUrl} alt={chatName} />
            <AvatarFallback className="bg-pink-100 text-pink-700 font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-[16px]">{chatName}</span>
            <span className="text-xs text-green-500">Đang hoạt động</span>
          </div>
        </div>

        <div className="flex gap-1.5 [&_svg]:stroke-[url(#brand-gradient)]">
          <Button
            variant="ghost"
            size="icon"
            className="w-11 h-11 hover:bg-gray-100 rounded-full transition"
          >
            <Phone size={24} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-11 h-11 hover:bg-gray-100 rounded-full transition"
          >
            <Video size={26} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-11 h-11 hover:bg-gray-100 rounded-full transition"
          >
            <Info size={24} />
          </Button>
        </div>
      </header>

      {/* Khu vực chứa tin nhắn (Có thanh cuộn) */}
      <MessageList chatId={chatId} />

      {/* Thanh nhập text */}
      <ChatInput chatId={chatId} />
    </div>
  );
}
