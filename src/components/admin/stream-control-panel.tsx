"use client";

import { useState, useEffect } from "react";
import { ShareLinkDialog } from "@/components/stream/share-link-dialog";
import { StreamPublisher } from "@/components/stream/stream-publisher";
import type { StreamStatus } from "@/types";

interface StreamControlPanelProps {
  streamId: string;
  status: StreamStatus;
  shareableSlug: string;
}

export function StreamControlPanel({
  streamId,
  status: initialStatus,
  shareableSlug,
}: StreamControlPanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [publisherData, setPublisherData] = useState<{
    token: string;
    wsUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-rejoin if page loads with LIVE status (e.g. after refresh)
  useEffect(() => {
    if (initialStatus === "LIVE") {
      rejoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function rejoin() {
    try {
      const res = await fetch(`/api/streams/${streamId}/rejoin`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPublisherData({ token: data.token, wsUrl: data.wsUrl });
      }
    } catch {
      // Silently fail
    }
  }

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/streams/${streamId}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("LIVE");
        setPublisherData({ token: data.token, wsUrl: data.wsUrl });
      } else {
        setError(data.details || data.error || "Failed to start stream");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setLoading(true);
    try {
      const res = await fetch(`/api/streams/${streamId}/stop`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus("ENDED");
        setPublisherData(null);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Start / Stop Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {status === "PENDING" && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Starting..." : "Go Live"}
          </button>
        )}
        {status === "LIVE" && (
          <button
            onClick={handleStop}
            disabled={loading}
            className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Stopping..." : "End Stream"}
          </button>
        )}
        {status === "ENDED" && (
          <span className="text-sm text-gray-500">Stream has ended</span>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Live Publisher - streams from browser webcam/screen */}
      {status === "LIVE" && publisherData && (
        <StreamPublisher
          token={publisherData.token}
          wsUrl={publisherData.wsUrl}
        />
      )}

      {/* Shareable Link */}
      {(status === "LIVE" || status === "RECORDED") && (
        <ShareLinkDialog slug={shareableSlug} />
      )}
    </div>
  );
}
