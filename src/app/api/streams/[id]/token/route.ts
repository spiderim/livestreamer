import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createViewerToken } from "@/lib/livekit-token";

interface Context {
  params: Promise<{ id: string }>;
}

// GET /api/streams/[id]/token - Generate LiveKit viewer token
export async function GET(_req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if viewer is blocked
  const isBlocked = await prisma.viewerBlock.findUnique({
    where: {
      streamId_blockedUserId: { streamId: id, blockedUserId: session.user.id },
    },
  });

  if (isBlocked) {
    return NextResponse.json(
      { error: "You have been blocked from this stream" },
      { status: 403 }
    );
  }

  const stream = await prisma.stream.findUnique({
    where: { id },
    select: { livekitRoomName: true, status: true },
  });

  if (!stream || !stream.livekitRoomName) {
    return NextResponse.json(
      { error: "Stream not available" },
      { status: 404 }
    );
  }

  const token = await createViewerToken(
    stream.livekitRoomName,
    session.user.id,
    session.user.name ?? "Viewer"
  );

  return NextResponse.json({
    token,
    wsUrl: process.env.LIVEKIT_URL!,
  });
}
