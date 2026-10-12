import NavSidebar from "./NavSidebar";
import ChatListSidebar from "./ChatListSidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    // Flex row để dàn 3 cột nằm ngang, ẩn cuộn màn hình tổng
    <div className="flex h-screen w-screen overflow-hidden bg-white text-black">
      
      {/* Cột 1: Thanh điều hướng (Cố định) */}
      <NavSidebar />

      {/* Cột 2: Danh sách chat (Cố định) */}
      <ChatListSidebar />

      {/* Cột 3: Khu vực chính (Thay đổi theo URL) */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
      
    </div>
  );
}
