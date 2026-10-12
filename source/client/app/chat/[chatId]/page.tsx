// Import giao diện "ActiveChat"
import ActiveChat from "@/components/chat/ActiveChat";

interface PageProps {
  params: Promise<{ chatId: string }>;
}

// Next.js tự động truyền params xuống
export default async function ActiveChatPage({ params }: PageProps) {
  // Lấy ID từ URL (ví dụ URL là /chat/123 thì params.chatId = "123")
  const { chatId } = await params;

  return (
    // Truyền ID đó xuống cho Component ActiveChat để nó biết phải load tin nhắn của ai
    <ActiveChat chatId={chatId} />
  );
}
