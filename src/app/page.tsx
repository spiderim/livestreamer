export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { StreamGrid } from "@/components/stream/stream-grid";
import type { StreamWithCreator } from "@/types";

export default async function HomePage() {
  const liveStreams = await prisma.stream.findMany({
    where: { status: "LIVE" },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { viewerSessions: { where: { isActive: true } } } },
    },
    orderBy: { startedAt: "desc" },
  });

  const recentRecordings = await prisma.stream.findMany({
    where: { status: "RECORDED" },
    include: {
      creator: { select: { id: true, name: true, image: true } },
    },
    orderBy: { endedAt: "desc" },
    take: 8,
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-10">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live Now</h2>
          <StreamGrid
            streams={liveStreams as unknown as StreamWithCreator[]}
            emptyMessage="No live streams right now"
          />
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Recordings
          </h2>
          <StreamGrid
            streams={recentRecordings as unknown as StreamWithCreator[]}
            emptyMessage="No recordings yet"
          />
        </section>
      </main>
    </>
  );
}
