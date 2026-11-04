"use client";

import NavSidebar from "@/components/chat/NavSidebar";
import ChatListSidebar from "@/components/chat/ChatListSidebar";
import GroupCallProvider from "@/components/chat/GroupCallProvider";
import VoiceCallProvider from "@/components/chat/VoiceCallProvider";
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
    <VoiceCallProvider>
      <GroupCallProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-white text-black">
          <NavSidebar />
          <ChatListSidebar />
          <main className="flex-1 flex flex-col min-w-0">{children}</main>
        </div>
      </GroupCallProvider>
    </VoiceCallProvider>
  );
}
