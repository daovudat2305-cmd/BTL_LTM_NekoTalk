"use client";

import { Phone, Video, Info } from "lucide-react";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";
import { ConversationType } from "@/types";
import { formatLastActive } from "@/lib/date";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useVoiceCall } from "./VoiceCallProvider";

export default function ActiveChat({ chatId }: { chatId: string }) {
  const { conversations, onlineUsers } = useChatStore();
  const currentUser = useUserStore((s) => s.user);
  const { startVoiceCall, startVideoCall } = useVoiceCall();

  // cuộc trò chuyện hiện tại
  const conversation = conversations.find((c) => c.id === chatId);

  //thông tin hiện tại
  let chatName = "Đang tải...";
  let avatarUrl: string | undefined = undefined;
  let isOnline = false;
  let lastOnlineAt: string | null = null;
  let isGroup = false;
  let partnerUserId: string | undefined;

  if (conversation) {
    if (conversation.conversationType === ConversationType.GROUP) {
      isGroup = true;
      chatName = conversation.name || "Nhóm trò chuyện";
      avatarUrl = conversation.conversationAvatar || undefined;
    } else {
      const partner = conversation.participantInfo?.find(
        (p) => p.userId !== currentUser?.userId,
      );
      chatName = partner ? partner.username : "Người dùng";
      partnerUserId = partner?.userId;
      avatarUrl = conversation.conversationAvatar || undefined;

      const partnerPresence = partner ? onlineUsers[partner.userId] : undefined;
      isOnline = partnerPresence !== undefined ? partnerPresence.isOnline : Boolean(conversation.isOnline);
      lastOnlineAt = partnerPresence !== undefined ? partnerPresence.lastOnlineAt : (conversation.lastOnlineAt || null);
    }
  }

  const initials = chatName.substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header của đoạn chat */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
          <div className="relative shrink-0">
            <Avatar size="lg" className="border border-border">
              <AvatarImage src={avatarUrl} alt={chatName} />
              <AvatarFallback className="bg-pink-100 text-pink-700 font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isOnline && !isGroup && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 shadow-xs" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[16px]">{chatName}</span>
            {isGroup ? (
              <span className="text-xs text-muted-foreground">
                {conversation?.participantInfo?.length || 0} thành viên
              </span>
            ) : isOnline ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 font-medium">Đang hoạt động</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatLastActive(lastOnlineAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 [&_svg]:stroke-[url(#brand-gradient)]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (conversation && partnerUserId) {
                startVoiceCall(conversation.id, partnerUserId, chatName);
              }
            }}
            disabled={isGroup || !conversation || !partnerUserId}
            aria-label="Gọi thoại"
            title={isGroup ? "Gọi thoại 1-1" : "Gọi thoại"}
            className="w-11 h-11 hover:bg-gray-100 rounded-full transition"
          >
            <Phone size={24} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (conversation && partnerUserId) {
                startVideoCall(conversation.id, partnerUserId, chatName);
              }
            }}
            disabled={isGroup || !conversation || !partnerUserId}
            aria-label="Gọi video"
            title={isGroup ? "Gọi video 1-1" : "Gọi video"}
            className="w-11 h-11 hover:bg-gray-100 rounded-full transition"
          >
            <Video size={24} />
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
