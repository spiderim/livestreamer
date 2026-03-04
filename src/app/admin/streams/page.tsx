export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { StreamStatusBadge } from "@/components/stream/stream-status-badge";
import type { StreamStatus } from "@/types";

export default async function AdminStreamsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const streams = await prisma.stream.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { viewerSessions: { where: { isActive: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Streams</h1>
        <Link
          href="/admin/streams/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Stream
        </Link>
      </div>

      {streams.length === 0 ? (
        <p className="text-sm text-gray-500">
          No streams yet. Create your first one!
        </p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {streams.map((stream) => (
            <Link
              key={stream.id}
              href={`/admin/streams/${stream.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stream.title}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(stream.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {stream.status === "LIVE" && (
                  <span className="text-xs text-gray-500">
                    {stream._count.viewerSessions} viewers
                  </span>
                )}
                <StreamStatusBadge status={stream.status as StreamStatus} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
