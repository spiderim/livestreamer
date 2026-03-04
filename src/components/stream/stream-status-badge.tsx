import type { StreamStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  StreamStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "bg-gray-100 text-gray-700" },
  LIVE: { label: "LIVE", className: "bg-red-600 text-white animate-pulse" },
  ENDED: { label: "Ended", className: "bg-gray-100 text-gray-700" },
  RECORDED: { label: "Recorded", className: "bg-blue-100 text-blue-700" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700" },
};

export function StreamStatusBadge({ status }: { status: StreamStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
