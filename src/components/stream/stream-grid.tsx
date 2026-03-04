import { StreamCard } from "./stream-card";
import type { StreamWithCreator } from "@/types";

interface StreamGridProps {
  streams: StreamWithCreator[];
  emptyMessage?: string;
}

export function StreamGrid({
  streams,
  emptyMessage = "No streams found",
}: StreamGridProps) {
  if (streams.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {streams.map((stream) => (
        <StreamCard key={stream.id} stream={stream} />
      ))}
    </div>
  );
}
