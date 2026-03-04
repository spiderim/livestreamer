"use client";

import { useState } from "react";

interface ViewerBlockButtonProps {
  streamId: string;
  userId: string;
  userName: string;
}

export function ViewerBlockButton({
  streamId,
  userId,
  userName,
}: ViewerBlockButtonProps) {
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  async function handleBlock() {
    if (!confirm(`Block ${userName} from this stream?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/streams/${streamId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setBlocked(true);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  if (blocked) {
    return (
      <span className="text-xs text-red-600 font-medium">Blocked</span>
    );
  }

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className="rounded px-3 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "..." : "Block"}
    </button>
  );
}
