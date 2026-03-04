"use client";

import { useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Room } from "livekit-client";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";

interface ChatPanelProps {
  room?: Room;
  streamId: string;
}

export function ChatPanel({ room, streamId }: ChatPanelProps) {
  const { data: session } = useSession();
  const { messages, sendMessage } = useChat(room, streamId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend(content: string) {
    if (!session?.user) return;
    sendMessage(content, {
      id: session.user.id,
      name: session.user.name ?? "Anonymous",
      image: session.user.image ?? null,
    });
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Live Chat</h3>
        <span className="text-xs text-gray-400">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-gray-400">
              No messages yet
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              userName={msg.userName}
              userImage={msg.userImage}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
