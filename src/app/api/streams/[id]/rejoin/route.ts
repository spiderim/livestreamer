import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStreamerToken } from "@/lib/livekit-token";

interface Context {
  params: Promise<{ id: string }>;
}

// POST /api/streams/[id]/rejoin — get a new publisher token for an existing LIVE stream
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

  if (!stream || stream.status !== "LIVE" || !stream.livekitRoomName) {
    return NextResponse.json(
      { error: "Stream is not live" },
      { status: 400 }
    );
  }

  const token = await createStreamerToken(
    stream.livekitRoomName,
    session.user.id,
    session.user.name ?? "Streamer"
  );

  return NextResponse.json({
    token,
    wsUrl: process.env.LIVEKIT_URL!,
  });
}
