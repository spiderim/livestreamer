import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roomService } from "@/lib/livekit";
import { createStreamerToken } from "@/lib/livekit-token";

interface Context {
  params: Promise<{ id: string }>;
}

// POST /api/streams/[id]/start
export async function POST(_req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const stream = await prisma.stream.findUnique({ where: { id } });

  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }
  if (stream.status !== "PENDING") {
    return NextResponse.json(
      { error: "Stream is not in PENDING status" },
      { status: 400 }
    );
  }

  try {
    const roomName = `stream-${id}`;

    // Create LiveKit room
    await roomService.createRoom({ name: roomName, emptyTimeout: 300 });

    // Generate a publisher token for the admin to stream from browser
    const token = await createStreamerToken(
      roomName,
      session.user.id,
      session.user.name ?? "Streamer"
    );

    // Update database
    const updated = await prisma.stream.update({
      where: { id },
      data: {
        status: "LIVE",
        livekitRoomName: roomName,
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      token,
      wsUrl: process.env.LIVEKIT_URL!,
      shareableLink: `/watch/${updated.shareableSlug}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to start stream:", message);
    return NextResponse.json(
      { error: "Failed to start stream", details: message },
      { status: 500 }
    );
  }
}
