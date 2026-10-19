"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, X, Loader2, Search, Check, Camera, Upload, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { userService } from "@/services/user.service";
import { conversationService } from "@/services/conversation.service";
import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";
import { ConversationType, UserDetailResponse } from "@/types";
import { toast } from "sonner";

export default function CreateGroupDialog() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.user);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserDetailResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserDetailResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm tải danh sách người dùng
  const loadUsers = useCallback(
    async (keyword: string) => {
      try {
        setIsSearching(true);
        const res = await userService.searchUsers(keyword, 1, 15);
        if (res.data?.content) {
          const filtered = res.data.content.filter(
            (u) => u.userId !== currentUser?.userId,
          );
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Lỗi khi tìm kiếm người dùng:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [currentUser?.userId],
  );

  // Tải danh sách ban đầu khi mở dialog
  useEffect(() => {
    if (isOpen) {
      loadUsers("");
    }
  }, [isOpen, loadUsers]);

  // Debounced search khi người dùng gõ từ khóa
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      loadUsers(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, loadUsers]);

  // Đóng/mở dialog và reset form
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setGroupName("");
      setAvatarUrl("");
      setShowUrlInput(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUsers([]);
      setIsUploadingAvatar(false);
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Xử lý tải ảnh đại diện từ máy tính
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate kích thước 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa là 5MB");
      return;
    }

    // Validate loại file ảnh
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error("Chỉ chấp nhận file ảnh định dạng JPEG, PNG hoặc WEBP");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const res = await conversationService.uploadAvatar(file);
      if (res.data?.avatarUrl) {
        setAvatarUrl(res.data.avatarUrl);
        toast.success("Tải ảnh đại diện nhóm thành công!");
      }
    } catch (error: any) {
      console.error("Lỗi tải ảnh lên:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể tải ảnh đại diện lên";
      toast.error(errorMsg);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleToggleUser = (user: UserDetailResponse) => {
    const isSelected = selectedUsers.some((u) => u.userId === user.userId);
    if (isSelected) {
      setSelectedUsers((prev) => prev.filter((u) => u.userId !== user.userId));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleRemoveUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUsers((prev) => prev.filter((u) => u.userId !== userId));
  };

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên nhóm trò chuyện");
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error("Vui lòng chọn ít nhất 2 thành viên khác để tạo nhóm (tổng tối thiểu 3 người)");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await conversationService.createConversation({
        name: trimmedName,
        conversationAvatar: avatarUrl.trim() || null,
        conversationType: ConversationType.GROUP,
        participantIds: selectedUsers.map((u) => u.userId),
      });

      if (res.data) {
        toast.success("Tạo nhóm trò chuyện thành công!");
        handleOpenChange(false);
        await fetchConversations();
        router.push(`/chat/${res.data.id}`);
      }
    } catch (error: any) {
      console.error("Lỗi khi tạo nhóm:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể tạo nhóm trò chuyện";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadyToSubmit =
    groupName.trim().length > 0 && selectedUsers.length >= 2 && !isUploadingAvatar;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200"
            title="Tạo nhóm trò chuyện mới"
            aria-label="Tạo nhóm trò chuyện mới"
          />
        }
      >
        <Users size={21} />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="text-pink-500" size={24} />
            Tạo nhóm trò chuyện
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Header Avatar & Tên nhóm */}
          <div className="flex items-center gap-4 p-3 bg-gray-50/70 rounded-xl border border-gray-100">
            {/* Input file ẩn */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            {/* Khung ảnh đại diện tròn */}
            <div className="relative group shrink-0">
              <div
                onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-full cursor-pointer overflow-hidden border-2 border-pink-200 hover:border-pink-400 transition shadow-xs flex items-center justify-center bg-pink-50"
                title="Nhấp để tải ảnh đại diện nhóm"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Group Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-pink-600 font-bold text-sm">
                    {groupName.trim() ? (
                      groupName.trim().slice(0, 2).toUpperCase()
                    ) : (
                      <Users size={24} />
                    )}
                  </div>
                )}

                {/* Overlay khi hover hoặc đang upload */}
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-white" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Camera size={18} className="text-white" />
                  </div>
                )}
              </div>

              {/* Nút camera nhỏ ở góc */}
              <button
                type="button"
                onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center shadow-md transition"
                title="Đổi ảnh đại diện"
              >
                <Camera size={12} />
              </button>
            </div>

            {/* Thông tin tên nhóm và hành động tải ảnh */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>
                  Tên nhóm <span className="text-red-500">*</span>
                </span>
                <span className="text-[11px] text-gray-400 font-normal">
                  {groupName.length}/50
                </span>
              </div>
              <Input
                placeholder="Ví dụ: Nhóm học Lập trình mạng..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value.slice(0, 50))}
                className="h-9 bg-white text-sm"
              />
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="text-pink-600 hover:text-pink-700 font-medium hover:underline inline-flex items-center gap-1"
                >
                  <Upload size={11} /> {avatarUrl ? "Đổi ảnh khác" : "Tải ảnh từ máy"}
                </button>
                {avatarUrl && (
                  <>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-gray-500 hover:text-red-600 font-medium hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  </>
                )}
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-gray-500 hover:text-gray-700 hover:underline inline-flex items-center gap-0.5"
                >
                  <LinkIcon size={10} /> Link URL
                </button>
              </div>
            </div>
          </div>

          {/* Ô nhập URL trực tiếp nếu người dùng muốn dán link web */}
          {showUrlInput && (
            <div className="space-y-1 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-[11px] font-semibold text-gray-600">
                Nhập đường dẫn ảnh trực tiếp (URL)
              </label>
              <Input
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
          )}

          {/* Thành viên đã chọn */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-700">
                Thành viên đã chọn ({selectedUsers.length})
              </span>
              {selectedUsers.length < 2 ? (
                <span className="text-amber-500 text-[11px] font-medium">
                  Cần thêm tối thiểu {2 - selectedUsers.length} người
                </span>
              ) : (
                <span className="text-green-600 text-[11px] font-medium flex items-center gap-1">
                  <Check size={12} /> Đã đủ điều kiện
                </span>
              )}
            </div>

            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50/70">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.userId}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 gap-1 text-xs bg-white border border-gray-200 shadow-xs hover:bg-gray-100"
                  >
                    <span className="max-w-[120px] truncate">{user.username}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveUser(user.userId, e)}
                      className="rounded-full hover:bg-gray-200 p-0.5 text-gray-500 hover:text-gray-800 transition"
                      aria-label={`Xóa ${user.username}`}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Chưa chọn thành viên nào (tối thiểu 2 người khác ngoài bạn)
              </p>
            )}
          </div>

          {/* Tìm kiếm thành viên */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Thêm thành viên</label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <Input
                placeholder="Tìm kiếm theo tên người dùng hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>

          {/* Danh sách người dùng để chọn */}
          <div className="max-h-[180px] overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200">
            {isSearching ? (
              <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                <Loader2 size={18} className="animate-spin text-pink-500" />
                <span className="text-xs">Đang tìm kiếm...</span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => {
                const isSelected = selectedUsers.some((u) => u.userId === user.userId);
                return (
                  <div
                    key={user.userId}
                    onClick={() => handleToggleUser(user)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition select-none ${
                      isSelected ? "bg-pink-50/60" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar size="sm" className="border border-border shrink-0">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback className="bg-pink-100 font-bold text-pink-600 text-xs">
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {user.username}
                        </span>
                        {user.email && (
                          <span className="text-xs text-gray-500 truncate">{user.email}</span>
                        )}
                      </div>
                    </div>
                    <div className="pointer-events-none ml-2 shrink-0">
                      <Checkbox checked={isSelected} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-gray-400">
                {searchQuery.trim()
                  ? "Không tìm thấy người dùng phù hợp"
                  : "Không có người dùng nào khác"}
              </div>
            )}
          </div>

          {/* Nút tác vụ */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting || isUploadingAvatar}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleCreateGroup}
              disabled={!isReadyToSubmit || isSubmitting}
              className="bg-pink-600 hover:bg-pink-700 text-white font-medium"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-1.5" />}
              Tạo nhóm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
