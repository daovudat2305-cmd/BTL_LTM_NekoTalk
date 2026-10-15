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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function NavSidebar() {
  const { logout } = useAuth();

  return (
    <nav className="w-[60px] flex flex-col items-center justify-between border-r border-gray-200 py-4">
      {/* Nhóm Icon phía trên */}
      <div className="flex flex-col gap-6 items-center">
        {/* Neko Logo */}
        <Image src="/logo.svg" alt="NekoTalk" width={52} height={52} />
        
        {/* Các Icon chức năng */}
        <div className="flex flex-col gap-1.5 items-center">
          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-black hover:bg-gray-200">
            <MessageCircle size={28} />
          </Button>
          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-gray-500 hover:bg-gray-100">
            <Users size={28} />
          </Button>
          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-gray-500 hover:bg-gray-100">
            <Settings size={28} />
          </Button>
          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-gray-500 hover:bg-gray-100">
            <CircleUser size={28} />
          </Button>
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
