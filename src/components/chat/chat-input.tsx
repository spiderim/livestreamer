"use client";

import { useState } from "react";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/constants";

interface ChatInputProps {
  onSend: (content: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessage("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-gray-200 p-2"
    >
      <div className="flex items-center gap-2 rounded-full bg-gray-100 pl-4 pr-1 py-1">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          placeholder="Say something..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 min-w-0"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  );
}
