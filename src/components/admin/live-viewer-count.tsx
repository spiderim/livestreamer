"use client";

import { useViewerCount } from "@/hooks/use-viewer-count";

export function LiveViewerCount({ streamId }: { streamId: string }) {
  const { count } = useViewerCount(streamId);

  return (
    <span>
      Viewers ({count})
    </span>
  );
}
