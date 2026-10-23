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
  hasUnread?: boolean;
  isOnline?: boolean;
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
  const hasUnread = Boolean(data.hasUnread);

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/80 cursor-pointer transition w-full ${
        hasUnread ? "bg-rose-50/40 dark:bg-rose-950/20" : ""
      }`}
    >
      <div className="relative shrink-0">
        <Avatar size="lg" className="border border-border">
          <AvatarImage src={data.avatarUrl} alt={data.name} />
          <AvatarFallback className="bg-pink-100 text-pink-700 font-semibold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        {data.isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-950 shadow-xs" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span
            className={`text-[15px] truncate ${
              hasUnread
                ? "font-bold text-gray-950 dark:text-white"
                : "font-medium text-gray-700 dark:text-gray-200"
            }`}
          >
            {data.name}
          </span>
          {formattedTime && (
            <span
              title={fullDateTime}
              className={`text-xs shrink-0 ${
                hasUnread
                  ? "font-semibold text-rose-500"
                  : "font-normal text-muted-foreground"
              }`}
            >
              {formattedTime}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${
              hasUnread
                ? "font-bold text-gray-900 dark:text-gray-100"
                : "text-muted-foreground"
            }`}
          >
            {data.message}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasUnread && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shrink-0 animate-pulse" />
            )}
            {data.isMuted && (
              <BellOff size={15} className="text-muted-foreground shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
