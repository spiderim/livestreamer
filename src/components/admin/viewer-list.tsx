"use client";

import { useEffect, useState } from "react";
import { VIEWER_POLL_INTERVAL_MS } from "@/lib/constants";
import { ViewerBlockButton } from "./viewer-block-button";
import type { ViewerWithUser } from "@/types";

interface ViewerListProps {
  streamId: string;
}

export function ViewerList({ streamId }: ViewerListProps) {
  const [viewers, setViewers] = useState<ViewerWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchViewers() {
      try {
        const res = await fetch(`/api/streams/${streamId}/viewers`);
        if (res.ok && active) {
          setViewers(await res.json());
        }
      } catch {
        // Silently fail
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchViewers();
    const interval = setInterval(fetchViewers, VIEWER_POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [streamId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading viewers...</p>;
  }

  if (viewers.length === 0) {
    return <p className="text-sm text-gray-500">No active viewers</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">
        {viewers.length} active viewer{viewers.length !== 1 ? "s" : ""}
      </p>
      <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
        {viewers.map((viewer) => (
          <div
            key={viewer.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {viewer.user.image ? (
                <img
                  src={viewer.user.image}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs">
                  {viewer.user.name?.[0] ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {viewer.user.name}
                </p>
                <p className="text-xs text-gray-500">{viewer.user.email}</p>
              </div>
            </div>
            <ViewerBlockButton
              streamId={streamId}
              userId={viewer.user.id}
              userName={viewer.user.name ?? "User"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
