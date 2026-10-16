"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Image as ImageIcon,
  Sticker,
  Smile,
  SendHorizonal,
  Loader2,
} from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatInput({ chatId }: { chatId: string }) {
  const [content, setContent] = useState("");
  const { sendMessage, sending, sendTyping } = useChatStore();

  const isTypingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTyping = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(chatId, false);
    }
  }, [chatId, sendTyping]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [chatId, stopTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContent(value);

    if (!value.trim()) {
      stopTyping();
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(chatId, true);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(chatId, false);
    }, 2500);
  };

  const handleSend = async () => {
    if (!content.trim() || sending) return;

    stopTyping();

    try {
      await sendMessage(chatId, content);
      setContent("");
    } catch (error) {
      console.error("Gửi lỗi: ", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className="p-4 bg-white">
      <div className="flex items-center gap-2">
        {/* Các nút đính kèm bên trái */}
        <div className="flex gap-1 [&_svg]:stroke-[url(#brand-gradient)]">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-10 h-10 hover:bg-gray-100 shrink-0"
          >
            <Mic className="w-[22px] h-[22px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-10 h-10 hover:bg-gray-100 shrink-0"
          >
            <ImageIcon className="w-[22px] h-[22px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-10 h-10 hover:bg-gray-100 shrink-0"
          >
            <Sticker className="w-[22px] h-[22px]" />
          </Button>
        </div>

        {/* Ô nhập text */}
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-1.5 gap-2 focus-within:ring-2 focus-within:ring-pink-500/50 transition-shadow">
          <Input
            type="text"
            placeholder="Aa"
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-[17px] px-0 h-9"
            disabled={sending}
          />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 hover:bg-gray-200 shrink-0"
          >
            <Smile className="size-6 text-gray-500" />
          </Button>
        </div>

        <Button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          variant="ghost"
          size="icon"
          className="rounded-full w-10 h-10 text-pink-500 hover:bg-pink-50 hover:text-pink-600 disabled:opacity-50 shrink-0"
        >
          {sending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <SendHorizonal className="size-6" />
          )}
        </Button>
      </div>
    </footer>
  );
}
