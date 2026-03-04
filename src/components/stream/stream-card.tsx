import Link from "next/link";
import { StreamStatusBadge } from "./stream-status-badge";
import type { StreamWithCreator } from "@/types";

interface StreamCardProps {
  stream: StreamWithCreator;
}

export function StreamCard({ stream }: StreamCardProps) {
  const href =
    stream.status === "LIVE"
      ? `/streams/${stream.shareableSlug}`
      : stream.status === "RECORDED"
        ? `/streams/${stream.shareableSlug}`
        : "#";

  return (
    <Link href={href} className="group block">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100">
          {stream.thumbnailUrl ? (
            <img
              src={stream.thumbnailUrl}
              alt={stream.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-800 text-gray-400">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <StreamStatusBadge status={stream.status} />
          </div>
          {stream.isPasswordProtected && (
            <div className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              Password
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600">
            {stream.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span>{stream.creator.name ?? "Unknown"}</span>
            {stream._count?.viewerSessions !== undefined && stream.status === "LIVE" && (
              <>
                <span>&middot;</span>
                <span>{stream._count.viewerSessions} watching</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
