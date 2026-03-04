import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecordingDetailPage({ params }: Props) {
  const { id } = await params;

  const stream = await prisma.stream.findUnique({
    where: { id, status: "RECORDED" },
    include: {
      creator: { select: { id: true, name: true, image: true } },
    },
  });

  if (!stream) return notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{stream.title}</h1>

      {stream.recordingUrl ? (
        <div className="aspect-video max-w-3xl rounded-lg overflow-hidden bg-black">
          <video src={stream.recordingUrl} controls className="h-full w-full" />
        </div>
      ) : (
        <p className="text-sm text-gray-500">Recording not available</p>
      )}

      <div className="text-sm text-gray-600 space-y-1">
        {stream.duration && (
          <p>
            Duration: {Math.floor(stream.duration / 60)}m{" "}
            {stream.duration % 60}s
          </p>
        )}
        {stream.googleDriveUrl && (
          <p>
            Google Drive:{" "}
            <a
              href={stream.googleDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View in Drive
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
