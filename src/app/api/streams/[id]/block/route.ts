import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roomService } from "@/lib/livekit";

interface Context {
  params: Promise<{ id: string }>;
}

// POST /api/streams/[id]/block
export async function POST(req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { userId, reason } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const stream = await prisma.stream.findUnique({ where: { id } });
  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  // Create block record
  await prisma.viewerBlock.create({
    data: {
      streamId: id,
      blockedUserId: userId,
      blockedById: session.user.id,
      reason,
    },
  });

  // Remove participant from LiveKit room
  if (stream.livekitRoomName) {
    try {
      await roomService.removeParticipant(stream.livekitRoomName, userId);
    } catch {
      // Participant may have already left
    }
  }

  // Mark viewer session as inactive
  await prisma.viewerSession.updateMany({
    where: { streamId: id, userId, isActive: true },
    data: { isActive: false, leftAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
