"use client";

import {
  MessageCircle,
  Users,
  Settings,
  CircleUser,
  HelpCircle,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/store/useChatStore";
import { cn } from "@/lib/utils";

export default function NavSidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const lastChatId = useChatStore((s) => s.lastChatId);

  const isProfile = pathname?.startsWith("/chat/profile") ?? false;
  const isChat =
    !isProfile &&
    (pathname === "/chat" || (pathname?.startsWith("/chat/") ?? false));
  const chatHref = lastChatId ? `/chat/${lastChatId}` : "/chat";

  return (
    <nav className="w-[60px] flex flex-col items-center justify-between border-r border-gray-200 py-4">
      {/* Nhóm Icon phía trên */}
      <div className="flex flex-col gap-6 items-center">
        {/* Neko Logo */}
        <Link href={chatHref} aria-label="Trang chủ NekoTalk" title="NekoTalk">
          <Image src="/logo.svg" alt="NekoTalk" width={52} height={52} priority />
        </Link>
        
        {/* Các Icon chức năng */}
        <div className="flex flex-col gap-1.5 items-center">
          {/* Nút chuyển về đoạn chat */}
          <Link
            href={isProfile ? chatHref : "/chat"}
            aria-label="Đoạn chat"
            title="Đoạn chat"
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-12 h-12 rounded-xl transition",
                isChat
                  ? "text-black bg-gray-200 hover:bg-gray-200"
                  : "text-gray-500 hover:bg-gray-100",
              )}
              aria-label="Đoạn chat"
            >
              <MessageCircle size={28} />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-xl text-gray-500 hover:bg-gray-100"
            aria-label="Danh bạ"
            title="Danh bạ"
          >
            <Users size={28} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-xl text-gray-500 hover:bg-gray-100"
            aria-label="Cài đặt"
            title="Cài đặt"
          >
            <Settings size={28} />
          </Button>

          {/* Mở hoặc đóng trang hồ sơ của tài khoản đang đăng nhập. Bấm khi đang ở profile sẽ quay lại chat. */}
          <Link
            href={isProfile ? chatHref : "/chat/profile"}
            aria-label={
              isProfile ? "Quay lại đoạn chat" : "Thông tin người dùng"
            }
            title={isProfile ? "Quay lại đoạn chat" : "Thông tin người dùng"}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-12 h-12 rounded-xl transition",
                isProfile
                  ? "text-black bg-gray-200 hover:bg-gray-200"
                  : "text-gray-500 hover:bg-gray-100",
              )}
              aria-label="Thông tin người dùng"
            >
              <CircleUser size={28} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Nhóm Icon phía dưới */}
      <div className="flex flex-col gap-4 items-center">
        {/* Nút gọi luồng đăng xuất và thu hồi refresh token. */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl text-gray-500 hover:bg-gray-100"
          aria-label="Đăng xuất"
          title="Đăng xuất"
          onClick={() => void logout()}
        >
          <LogOut size={24} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl text-gray-500 hover:bg-gray-100"
          aria-label="Trợ giúp"
          title="Trợ giúp"
        >
          <HelpCircle size={28} />
        </Button>
      </div>
    </nav>
  );
}
