import { MessageSquareDashed, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50/50">
      <div className="flex flex-col items-center max-w-md text-center">
        
        {/* Icon bong bóng chat */}
        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <MessageSquareDashed size={48} />
        </div>

        <h3 className="text-2xl font-bold mb-2">Chọn một cuộc trò chuyện để bắt đầu</h3>
        <p className="text-gray-500 mb-8 text-sm">
          Chọn một cuộc trò chuyện từ danh sách bên trái hoặc tạo cuộc trò chuyện mới bằng cách nhấn vào nút +
        </p>

        {/* Nút hành động */}
        <div className="flex gap-4">
          <Button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            <User size={18} /> Nhắn tin riêng tư
          </Button>
          <Button className="flex items-center gap-2 px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition">
            <Users size={18} /> Trò chuyện nhóm
          </Button>
        </div>

      </div>
    </div>
  );
}
