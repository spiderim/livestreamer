import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Context {
  params: Promise<{ streamId: string }>;
}

// GET /api/chat/[streamId] - Get chat history
export async function GET(req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { streamId } = await params;
  const url = new URL(req.url);
  const take = parseInt(url.searchParams.get("take") ?? "100");
  const cursor = url.searchParams.get("cursor");

  const messages = await prisma.chatMessage.findMany({
    where: { streamId },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  return NextResponse.json(messages);
}
