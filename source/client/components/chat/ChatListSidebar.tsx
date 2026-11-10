"use client";

import { SquarePen, Search, X, Loader2 } from "lucide-react";
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

// Hàm chuẩn hóa chuỗi tiếng Việt không dấu để tìm kiếm mượt mà
const normalizeSearchText = (text: string): string => {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
};

export default function ChatListSidebar() {
  const {
    conversations,
    fetchConversations,
    loadingConversations,
    setLastChatId,
    onlineUsers,
  } = useChatStore();
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

  // Tìm kiếm người dùng trên server khi nhập từ khóa (tính năng mở rộng như Messenger)
  const [globalUserResults, setGlobalUserResults] = useState<UserDetailResponse[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Tìm kiếm user để chat 1-1 qua dialog
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserDetailResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Debounce tìm kiếm người dùng mới khi gõ từ khóa trên thanh tìm kiếm
  useEffect(() => {
    const trimmed = conversationFilter.trim();
    if (!trimmed || filterTab === "GROUP") {
      setGlobalUserResults([]);
      setIsSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const res = await userService.searchUsers(trimmed);
        if (res.data?.content) {
          // Lọc bỏ tài khoản hiện tại
          const filtered = res.data.content.filter(
            (u) => u.userId !== currentUser?.userId,
          );
          setGlobalUserResults(filtered);
        }
      } catch (err) {
        console.error("Lỗi khi tìm kiếm người dùng toàn cục:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [conversationFilter, filterTab, currentUser?.userId]);

  const getDisplayInfo = (conv: ConversationDetailResponse) => {
    if (conv.conversationType === ConversationType.GROUP) {
      return {
        name: conv.name || "Nhóm trò chuyện",
        avatarUrl: conv.conversationAvatar || undefined,
      };
    }

    // Với chat 1-1: Backend toConversationDetailResponse đã gán conv.name là tên partner.
    let displayName = conv.name;
    if (!displayName && conv.participantInfo) {
      const partner = conv.participantInfo.find(
        (p) => !currentUser?.userId || p.userId !== currentUser.userId,
      );
      if (partner) displayName = partner.username;
    }

    return {
      name: displayName || "Người dùng",
      avatarUrl: conv.conversationAvatar || undefined,
    };
  };

  // Tìm kiếm user (xử lý search 1-1 trong dialog)
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
        setConversationFilter(""); // Xóa từ khóa tìm kiếm khi đã chọn chat
        fetchConversations(); // Reload danh sách
        router.push(`/chat/${res.data.id}`); // Chuyển hướng tới khung chat
      }
    } catch (error) {
      console.error("Lỗi khi tạo chat", error);
    }
  };

  // Danh sách hội thoại sau khi lọc theo Tab và Search box
  const filteredConversations = useMemo(() => {
    return conversations.filter((chat) => {
      // 1. Lọc theo tab loại hội thoại
      if (filterTab === "GROUP" && chat.conversationType !== ConversationType.GROUP) {
        return false;
      }
      if (filterTab === "PRIVATE" && chat.conversationType !== ConversationType.PRIVATE) {
        return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm (hỗ trợ có dấu và không dấu tiếng Việt)
      if (conversationFilter.trim()) {
        const rawKw = conversationFilter.trim().toLowerCase();
        const normKw = normalizeSearchText(rawKw);

        const { name } = getDisplayInfo(chat);
        const rawName = (name || "").toLowerCase();
        const normName = normalizeSearchText(name || "");

        // Khớp theo tên cuộc trò chuyện
        if (rawName.includes(rawKw) || normName.includes(normKw)) {
          return true;
        }

        // Khớp theo tên hoặc email của thành viên trong nhóm / cuộc trò chuyện
        const matchParticipant = chat.participantInfo?.some((p) => {
          const rawU = (p.username || "").toLowerCase();
          const normU = normalizeSearchText(p.username || "");
          const rawEmail = (p.email || "").toLowerCase();
          return (
            rawU.includes(rawKw) ||
            normU.includes(normKw) ||
            rawEmail.includes(rawKw)
          );
        });

        if (matchParticipant) {
          return true;
        }

        return false;
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
        <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white border border-transparent focus-within:border-gray-300 transition-all">
          <Search size={18} className="text-gray-500 mr-2 shrink-0" />
          <Input
            type="text"
            placeholder="Tìm kiếm trên Messenger"
            value={conversationFilter}
            onChange={(e) => setConversationFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setConversationFilter("");
            }}
            className="bg-transparent border-none outline-none shadow-none focus-visible:ring-0 px-0 h-8 text-sm placeholder:text-gray-500"
          />
          {conversationFilter && (
            <button
              type="button"
              onClick={() => setConversationFilter("")}
              className="w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 flex items-center justify-center shrink-0 ml-1 transition"
              title="Xóa tìm kiếm"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-2 mb-2">
        <Button
          variant="ghost"
          onClick={() => setFilterTab("ALL")}
          className={`px-3 py-1.5 h-auto rounded-full text-sm font-semibold transition ${
            filterTab === "ALL"
              ? "bg-gray-100 text-black font-bold shadow-xs"
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
              ? "bg-gray-100 text-black font-bold shadow-xs"
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
              ? "bg-gray-100 text-black font-bold shadow-xs"
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
        ) : filteredConversations.length === 0 && (!conversationFilter.trim() || (!isSearchingUsers && globalUserResults.length === 0)) ? (
          <div className="p-6 text-sm text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            {conversationFilter.trim() ? (
              <>
                <Search size={32} className="text-gray-300 stroke-[1.5]" />
                <p className="text-gray-500 font-medium">
                  Không tìm thấy {
                    filterTab === "GROUP"
                      ? "nhóm trò chuyện"
                      : filterTab === "PRIVATE"
                        ? "cuộc trò chuyện cá nhân"
                        : "cuộc trò chuyện"
                  } nào phù hợp với &quot;{conversationFilter.trim()}&quot;
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConversationFilter("")}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3 rounded-full mt-1"
                >
                  Xóa bộ lọc
                </Button>
              </>
            ) : filterTab === "GROUP" ? (
              "Chưa có cuộc trò chuyện nhóm nào"
            ) : filterTab === "PRIVATE" ? (
              "Chưa có cuộc trò chuyện cá nhân nào"
            ) : (
              "Chưa có cuộc trò chuyện nào"
            )}
          </div>
        ) : (
          <>
            {/* Danh sách các cuộc trò chuyện khớp tìm kiếm */}
            {filteredConversations.map((chat) => {
              const { name, avatarUrl } = getDisplayInfo(chat);
              const lastMsg =
                chat.lastMessageContent || "Bắt đầu cuộc trò chuyện";

              const isActive = currentChatId === chat.id;

              // Xác định trạng thái online cho chat 1-1
              let isOnline = false;
              if (chat.conversationType === ConversationType.PRIVATE) {
                const partner = chat.participantInfo?.find(
                  (p) => !currentUser?.userId || p.userId !== currentUser.userId,
                );
                if (partner && onlineUsers[partner.userId] !== undefined) {
                  isOnline = onlineUsers[partner.userId].isOnline;
                } else {
                  isOnline = Boolean(chat.isOnline);
                }
              }

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
                        hasUnread: chat.hasUnread && !isActive,
                        isOnline: isOnline,
                      }}
                    />
                  </div>
                </Link>
              );
            })}

            {/* Mục tìm kiếm người dùng mới (nếu đang tìm kiếm từ khóa và không ở tab Nhóm) */}
            {conversationFilter.trim() && filterTab !== "GROUP" && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="px-3 pb-1.5 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span>Mọi người</span>
                  {isSearchingUsers && (
                    <Loader2 size={12} className="animate-spin text-gray-400" />
                  )}
                </div>
                {globalUserResults.length > 0 ? (
                  globalUserResults.map((user) => (
                    <div
                      key={user.userId}
                      onClick={() => handleStartChat(user.userId)}
                      className="p-2 flex items-center gap-3 hover:bg-gray-100 cursor-pointer rounded-lg transition"
                    >
                      <Avatar size="lg">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback className="bg-pink-100 font-bold text-pink-600">
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate">{user.username}</span>
                        {user.email && (
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : !isSearchingUsers && filteredConversations.length === 0 ? (
                  <div className="p-3 text-xs text-center text-gray-400">
                    Không tìm thấy người dùng nào
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
