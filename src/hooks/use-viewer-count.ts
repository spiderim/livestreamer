"use client";

import { useEffect, useState } from "react";
import { VIEWER_POLL_INTERVAL_MS } from "@/lib/constants";

export function useViewerCount(streamId: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchCount() {
      try {
        const res = await fetch(`/api/streams/${streamId}/viewers`);
        if (res.ok && active) {
          const data = await res.json();
          setCount(Array.isArray(data) ? data.length : 0);
        }
      } catch {
        // Silently fail
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, VIEWER_POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [streamId]);

  return { count, loading };
}
