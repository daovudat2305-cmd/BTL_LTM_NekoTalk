import { MessageSquareDashed } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50/50">
      <div className="flex flex-col items-center max-w-md text-center p-6">
        
        {/* Icon bong bóng chat */}
        <div className="w-24 h-24 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mb-6">
          <MessageSquareDashed size={48} />
        </div>

        <h3 className="text-2xl font-bold mb-2">Chọn một cuộc trò chuyện để bắt đầu</h3>
        <p className="text-gray-500 text-sm">
          Chọn một cuộc trò chuyện từ danh sách bên trái hoặc nhấn vào biểu tượng tạo tin nhắn mới để bắt đầu.
        </p>

      </div>
    </div>
  );
}
