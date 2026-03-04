export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { StreamGrid } from "@/components/stream/stream-grid";
import type { StreamWithCreator } from "@/types";

export default async function StreamsPage() {
  const streams = await prisma.stream.findMany({
    where: { status: { in: ["LIVE", "RECORDED"] } },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { viewerSessions: { where: { isActive: true } } } },
    },
    orderBy: [{ status: "asc" }, { startedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All Streams</h1>
      <StreamGrid
        streams={streams as unknown as StreamWithCreator[]}
        emptyMessage="No streams available"
      />
    </div>
  );
}
