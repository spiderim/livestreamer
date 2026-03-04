import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roomService } from "@/lib/livekit";

interface Context {
  params: Promise<{ id: string }>;
}

// GET /api/streams/[id]/viewers — get live viewer count from LiveKit directly
export async function GET(_req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const stream = await prisma.stream.findUnique({
    where: { id },
    select: { livekitRoomName: true, status: true },
  });

  if (!stream || !stream.livekitRoomName || stream.status !== "LIVE") {
    return NextResponse.json([]);
  }

  try {
    // Get live participants from LiveKit room directly
    const participants = await roomService.listParticipants(
      stream.livekitRoomName
    );

    // Filter out the streamer (identity starts with "streamer-")
    const viewers = participants
      .filter((p) => !p.identity.startsWith("streamer-"))
      .map((p) => ({
        id: p.sid,
        identity: p.identity,
        name: p.name || p.identity,
        joinedAt: new Date(Number(p.joinedAt) * 1000).toISOString(),
        user: {
          id: p.identity,
          name: p.name || p.identity,
          email: null,
          image: null,
        },
      }));

    return NextResponse.json(viewers);
  } catch (error) {
    console.error("Failed to get viewers:", error);
    // Fallback to database
    const dbViewers = await prisma.viewerSession.findMany({
      where: { streamId: id, isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: "desc" },
    });
    return NextResponse.json(dbViewers);
  }
}
