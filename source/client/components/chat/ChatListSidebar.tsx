"use client";

import { MoreHorizontal, SquarePen, Search } from "lucide-react";
import ChatItem from "./ChatItem";
import Link from "next/link";
import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  ConversationDetailResponse,
  ConversationType,
  UserDetailResponse,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userService } from "@/services/user.service";
import { conversationService } from "@/services/conversation.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export default function ChatListSidebar() {
  const { conversations, fetchConversations, loadingConversations } =
    useChatStore();
  const currentUser = useUserStore((s) => s.user);
  const params = useParams();
  const currentChatId = params?.chatId as string;

  //tìm kiếm user
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserDetailResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getDisplayInfo = (conv: ConversationDetailResponse) => {
    if (conv.conversationType === ConversationType.GROUP) {
      return {
        name: conv.name || "Nhóm trò chuyện",
        avatarUrl: conv.conversationAvatar || undefined,
      };
    }

    const partner = conv.participantInfo?.find(
      (p) => p.userId !== currentUser?.userId,
    );

    return {
      name: partner ? partner.username : conv.name || "Người dùng",
      avatarUrl: conv.conversationAvatar || undefined,
    };
  };

  //tìm kiếm user (xử lý search)
  const handleSearchUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      try {
        const res = await userService.searchUsers(val);
        if (res.data?.content) setSearchResults(res.data.content);
      } catch (error) {}
    } else {
      setSearchResults([]);
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      const res = await conversationService.createConversation({
        conversationType: ConversationType.PRIVATE,
        participantIds: [userId],
      });
      if (res.data) {
        setIsOpen(false);
        fetchConversations(); // Reload danh sách
        router.push(`/chat/${res.data.id}`); // Chuyển hướng tới khung chat mới
      }
    } catch (error) {
      console.error("Lỗi khi tạo chat", error);
    }
  };

  return (
    <aside className="w-[360px] flex flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-2xl font-bold">Đoạn chat</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <MoreHorizontal size={22} />
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200"
                />
              }
            >
              <SquarePen size={22} />
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tin nhắn mới</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-4">
                <Input
                  placeholder="Tìm kiếm theo tên..."
                  value={searchQuery}
                  onChange={handleSearchUser}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <div className="max-h-[300px] overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.userId}
                      onClick={() => handleStartChat(user.userId)}
                      className="p-3 flex items-center gap-3 hover:bg-gray-100 cursor-pointer rounded-md"
                    >
                      <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center font-bold text-pink-600">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="px-4 pb-2">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search size={20} className="text-gray-500 mr-2 shrink-0" />
          <Input
            type="text"
            placeholder="Tìm kiếm trên Messenger"
            className="bg-transparent border-none outline-none shadow-none focus-visible:ring-0 px-0 h-auto text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-2 mb-2">
        <Button
          variant="ghost"
          className="px-3 py-1.5 h-auto bg-gray-100 rounded-full text-sm font-semibold"
        >
          Tất cả
        </Button>
        <Button
          variant="ghost"
          className="px-3 py-1.5 h-auto hover:bg-gray-100 rounded-full text-sm font-medium text-gray-600"
        >
          Chưa đọc
        </Button>
        <Button
          variant="ghost"
          className="px-3 py-1.5 h-auto hover:bg-gray-100 rounded-full text-sm font-medium text-gray-600"
        >
          Nhóm
        </Button>
      </div>

      {/* Danh sách đoạn chat */}
      <div className="flex-1 overflow-y-auto px-2">
        {loadingConversations && conversations.length === 0 ? (
          <div className="p-4 text-sm text-center text-gray-500">
            Đang tải cuộc trò chuyện...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-sm text-center text-gray-400">
            Chưa có cuộc trò chuyện nào
          </div>
        ) : (
          conversations.map((chat) => {
            const { name, avatarUrl } = getDisplayInfo(chat);
            const lastMsg =
              chat.lastMessageContent || "Bắt đầu cuộc trò chuyện";

            const isActive = currentChatId === chat.id;

            return (
              <Link href={`/chat/${chat.id}`} key={chat.id} className="block">
                <div
                  className={`rounded-lg transition ${isActive ? "bg-gray-100" : ""}`}
                >
                  <ChatItem
                    data={{
                      id: chat.id,
                      name: name,
                      message: lastMsg,
                      avatarUrl: avatarUrl,
                    }}
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
