"use client";

import { useEffect, useState } from "react";
import type { StreamStatus } from "@/types";

export function useStreamStatus(streamId: string, initialStatus: StreamStatus) {
  const [status, setStatus] = useState<StreamStatus>(initialStatus);

  useEffect(() => {
    let active = true;

    async function pollStatus() {
      try {
        const res = await fetch(`/api/streams/${streamId}`);
        if (res.ok && active) {
          const data = await res.json();
          setStatus(data.status);
        }
      } catch {
        // Silently fail
      }
    }

    const interval = setInterval(pollStatus, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [streamId]);

  return status;
}
