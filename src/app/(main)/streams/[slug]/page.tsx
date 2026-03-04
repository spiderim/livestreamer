import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StreamPlayer } from "@/components/stream/stream-player";
import { ChatPanel } from "@/components/chat/chat-panel";
import { StreamStatusBadge } from "@/components/stream/stream-status-badge";
import type { StreamStatus } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function WatchStreamPage({ params }: Props) {
  const { slug } = await params;

  const stream = await prisma.stream.findUnique({
    where: { shareableSlug: slug },
    include: {
      creator: { select: { id: true, name: true, image: true } },
    },
  });

  if (!stream) return notFound();

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Title bar */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-base md:text-xl font-bold text-gray-900">
          {stream.title}
        </h1>
        <StreamStatusBadge status={stream.status as StreamStatus} />
      </div>

      {stream.status === "LIVE" ? (
        <>
          {/* Video - full width on mobile */}
          <div className="w-full">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <StreamPlayer streamId={stream.id} />
            </div>
          </div>

          {/* Stream info - below video on mobile */}
          <div className="flex items-center gap-2 px-1">
            {stream.creator.image && (
              <img
                src={stream.creator.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {stream.creator.name}
              </p>
              {stream.description && (
                <p className="text-xs text-gray-500">{stream.description}</p>
              )}
            </div>
          </div>

          {/* Chat - below video on mobile, side on desktop */}
          <div className="rounded-lg border border-gray-200 overflow-hidden h-[350px] md:h-[400px]">
            <ChatPanel streamId={stream.id} />
          </div>
        </>
      ) : stream.status === "RECORDED" && stream.recordingUrl ? (
        <>
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <video
              src={stream.recordingUrl}
              controls
              className="h-full w-full"
            />
          </div>
          <div className="flex items-center gap-2 px-1">
            {stream.creator.image && (
              <img
                src={stream.creator.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <p className="text-sm font-medium text-gray-900">
              {stream.creator.name}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 overflow-hidden h-[300px]">
            <ChatPanel streamId={stream.id} />
          </div>
        </>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          Stream is not available
        </div>
      )}
    </div>
  );
}
