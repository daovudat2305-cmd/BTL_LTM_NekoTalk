"use client";

import { MoreHorizontal, SquarePen, Search } from "lucide-react";
import ChatItem from "./ChatItem";
import CreateGroupDialog from "./CreateGroupDialog";
import Link from "next/link";
import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatListSidebar() {
  const { conversations, fetchConversations, loadingConversations, setLastChatId } =
    useChatStore();
  const currentUser = useUserStore((s) => s.user);
  const params = useParams();
  const currentChatId = params?.chatId as string;

  useEffect(() => {
    if (currentChatId) {
      setLastChatId(currentChatId);
    }
  }, [currentChatId, setLastChatId]);

  // Bộ lọc tabs và tìm kiếm
  const [filterTab, setFilterTab] = useState<"ALL" | "PRIVATE" | "GROUP">("ALL");
  const [conversationFilter, setConversationFilter] = useState("");

  // Tìm kiếm user để chat 1-1
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

  // Tìm kiếm user (xử lý search 1-1)
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

  // Danh sách hội thoại sau khi lọc theo Tab và Search box
  const filteredConversations = useMemo(() => {
    return conversations.filter((chat) => {
      if (filterTab === "GROUP" && chat.conversationType !== ConversationType.GROUP) {
        return false;
      }
      if (filterTab === "PRIVATE" && chat.conversationType !== ConversationType.PRIVATE) {
        return false;
      }
      if (conversationFilter.trim()) {
        const { name } = getDisplayInfo(chat);
        return name.toLowerCase().includes(conversationFilter.trim().toLowerCase());
      }
      return true;
    });
  }, [conversations, filterTab, conversationFilter, currentUser?.userId]);

  return (
    <aside className="w-[360px] flex flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-2xl font-bold">Đoạn chat</h2>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200"
            title="Tùy chọn khác"
          >
            <MoreHorizontal size={22} />
          </Button>

          {/* Nút Tạo nhóm chat */}
          <CreateGroupDialog />

          {/* Nút Tin nhắn mới (Chat 1-1) */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200"
                  title="Tin nhắn mới"
                  aria-label="Tin nhắn mới"
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
                      <Avatar size="lg">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback className="bg-pink-200 font-bold text-pink-600">
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.username}</span>
                        {user.email && (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
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
            value={conversationFilter}
            onChange={(e) => setConversationFilter(e.target.value)}
            className="bg-transparent border-none outline-none shadow-none focus-visible:ring-0 px-0 h-auto text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-2 mb-2">
        <Button
          variant="ghost"
          onClick={() => setFilterTab("ALL")}
          className={`px-3 py-1.5 h-auto rounded-full text-sm font-semibold transition ${
            filterTab === "ALL"
              ? "bg-gray-100 text-black font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Tất cả
        </Button>
        <Button
          variant="ghost"
          onClick={() => setFilterTab("PRIVATE")}
          className={`px-3 py-1.5 h-auto rounded-full text-sm font-medium transition ${
            filterTab === "PRIVATE"
              ? "bg-gray-100 text-black font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Cá nhân
        </Button>
        <Button
          variant="ghost"
          onClick={() => setFilterTab("GROUP")}
          className={`px-3 py-1.5 h-auto rounded-full text-sm font-medium transition ${
            filterTab === "GROUP"
              ? "bg-gray-100 text-black font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
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
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-sm text-center text-gray-400">
            {filterTab === "GROUP"
              ? "Chưa có cuộc trò chuyện nhóm nào"
              : filterTab === "PRIVATE"
                ? "Chưa có cuộc trò chuyện cá nhân nào"
                : conversationFilter.trim()
                  ? "Không tìm thấy cuộc trò chuyện nào"
                  : "Chưa có cuộc trò chuyện nào"}
          </div>
        ) : (
          filteredConversations.map((chat) => {
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
                      time: chat.lastMessageTime,
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
