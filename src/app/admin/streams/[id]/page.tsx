import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StreamControlPanel } from "@/components/admin/stream-control-panel";
import { LiveViewerCount } from "@/components/admin/live-viewer-count";
import type { StreamStatus } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StreamControlPage({ params }: Props) {
  const { id } = await params;

  const stream = await prisma.stream.findUnique({
    where: { id },
  });

  if (!stream) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{stream.title}</h1>
        {stream.status === "LIVE" && (
          <Link
            href={`/admin/streams/${id}/viewers`}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LiveViewerCount streamId={stream.id} />
          </Link>
        )}
      </div>

      {stream.description && (
        <p className="text-sm text-gray-600">{stream.description}</p>
      )}

      <StreamControlPanel
        streamId={stream.id}
        status={stream.status as StreamStatus}
        shareableSlug={stream.shareableSlug}
      />
    </div>
  );
}
