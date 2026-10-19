import { BellOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatConversationTime, formatFullDateTime } from "@/lib/date";

export interface ChatItemData {
  id?: string;
  name: string;
  message?: string;
  avatarUrl?: string;
  time?: string | null;
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

  const formattedTime = formatConversationTime(data.time);
  const fullDateTime = formatFullDateTime(data.time);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/80 cursor-pointer transition w-full">
      <Avatar size="lg" className="border border-border shrink-0">
        <AvatarImage src={data.avatarUrl} alt={data.name} />
        <AvatarFallback className="bg-pink-100 text-pink-700 font-semibold text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="font-medium text-[15px] truncate">{data.name}</span>
          {formattedTime && (
            <span
              title={fullDateTime}
              className="text-xs text-muted-foreground shrink-0 font-normal"
            >
              {formattedTime}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground truncate">
            {data.message}
          </span>
          {data.isMuted && (
            <BellOff size={15} className="text-muted-foreground shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
