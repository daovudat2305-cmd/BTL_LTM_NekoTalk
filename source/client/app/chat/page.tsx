"use client";

import { useEffect } from "react";
import EmptyState from "@/components/chat/EmptyState";
import { useChatStore } from "@/store/useChatStore";

export default function ChatIndexPage() {
  const setLastChatId = useChatStore((s) => s.setLastChatId);

  useEffect(() => {
    setLastChatId(null);
  }, [setLastChatId]);

  return <EmptyState />;
}
