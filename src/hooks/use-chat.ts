"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DataPacket_Kind,
  RoomEvent,
  type Room,
} from "livekit-client";
import type { ChatMessageWithUser } from "@/types";

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage: string | null;
  timestamp: number;
}

export function useChat(room: Room | undefined, streamId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load existing chat history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat/${streamId}`);
        if (res.ok) {
          const data: ChatMessageWithUser[] = await res.json();
          setMessages(
            data.map((m) => ({
              id: m.id,
              content: m.content,
              userId: m.user.id,
              userName: m.user.name ?? "Anonymous",
              userImage: m.user.image,
              timestamp: new Date(m.createdAt).getTime(),
            }))
          );
        }
      } catch {
        // Silently fail — chat history is non-critical
      }
    }
    loadHistory();
  }, [streamId]);

  // Listen for incoming data channel messages
  useEffect(() => {
    if (!room) return;

    const handleData = (
      payload: Uint8Array,
      _participant: unknown,
      _kind: unknown
    ) => {
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload)) as ChatMessage;
        if (message.content) {
          setMessages((prev) => [...prev, message]);
        }
      } catch {
        // Invalid message format — ignore
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  // Send a message via LiveKit data channel + persist to API
  const sendMessage = useCallback(
    async (content: string, user: { id: string; name: string; image: string | null }) => {
      if (!room) return;

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        userId: user.id,
        userName: user.name,
        userImage: user.image,
        timestamp: Date.now(),
      };

      // Send via LiveKit data channel
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      await room.localParticipant.publishData(data, {
        reliable: true,
      });

      // Add to local state
      setMessages((prev) => [...prev, message]);

      // Persist to database
      fetch(`/api/chat/${streamId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).catch(() => {
        // Non-critical — message was already sent via data channel
      });
    },
    [room, streamId]
  );

  return { messages, sendMessage };
}
