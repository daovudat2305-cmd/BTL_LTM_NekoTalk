"use client";

import React from "react";

interface TypingIndicatorProps {
  usernames: string[];
}

export default function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (!usernames || usernames.length === 0) return null;

  const displayText =
    usernames.length === 1
      ? `${usernames[0]} đang nhập văn bản...`
      : usernames.length === 2
      ? `${usernames[0]} và ${usernames[1]} đang nhập...`
      : `${usernames[0]} và những người khác đang nhập...`;

  return (
    <div className="flex flex-col gap-1 self-start max-w-[70%] animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 rounded-2xl rounded-bl-sm shadow-xs">
          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.32s]" />
          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.16s]" />
          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" />
        </div>
        <span className="text-xs text-gray-400 italic select-none">
          {displayText}
        </span>
      </div>
    </div>
  );
}
