import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSasUrl } from "@/lib/blob-storage";

interface Context {
  params: Promise<{ id: string }>;
}

// GET /api/recordings/[id] - Get recording with SAS URL
export async function GET(_req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const stream = await prisma.stream.findUnique({
    where: { id, status: "RECORDED" },
    include: {
      creator: { select: { id: true, name: true, image: true } },
    },
  });

  if (!stream) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  // Generate SAS URL for blob access if recording exists
  let playbackUrl = stream.recordingUrl;
  if (stream.recordingBlobPath) {
    playbackUrl = generateSasUrl(stream.recordingBlobPath);
  }

  return NextResponse.json({
    ...stream,
    playbackUrl,
  });
}
