import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations/chat";

interface Context {
  params: Promise<{ streamId: string }>;
}

// POST /api/chat/[streamId]/send
export async function POST(req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { streamId } = await params;

  // Check if user is blocked from this stream
  const isBlocked = await prisma.viewerBlock.findUnique({
    where: {
      streamId_blockedUserId: {
        streamId,
        blockedUserId: session.user.id,
      },
    },
  });

  if (isBlocked) {
    return NextResponse.json({ error: "Blocked" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      content: parsed.data.content,
      streamId,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
