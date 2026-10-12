import { BellOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ChatItemData {
  id?: string;
  name: string;
  message?: string;
  avatarUrl?: string;
  isMuted?: boolean;
}

export default function ChatItem({ data }: { data: ChatItemData }) {
  const initials = data?.name
    ? data.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NT";

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/80 cursor-pointer transition">
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="border border-border">
          <AvatarImage src={data.avatarUrl} alt={data.name} />
          <AvatarFallback className="bg-pink-100 text-pink-700 font-semibold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex flex-col">
          <span className="font-medium text-[15px]">{data.name}</span>
          <span className="text-sm text-muted-foreground truncate w-[200px]">
            {data.message}
          </span>
        </div>
      </div>

      {/* Trạng thái tắt âm (nếu có) */}
      {data.isMuted && <BellOff size={16} className="text-muted-foreground" />}
    </div>
  );
}
