"use client";

import NavSidebar from "@/components/chat/NavSidebar";
import ChatListSidebar from "@/components/chat/ChatListSidebar";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //kích hoạt kết nối websocket xuyên suốt module chat
  const { isConnected } = useWebSocket();

  console.log("[ChatLayout] render, isConnected:", isConnected);

  return (
    // Flex row dàn ngang 3 cột, chiếm toàn màn hình
    <div className="flex h-screen w-screen overflow-hidden bg-white text-black">
      {/* Cột 1 */}
      <NavSidebar />
      {/* Cột 2 */}
      <ChatListSidebar />
      {/* Cột 3: Nơi Next.js tự động nhúng các trang con vào */}
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
