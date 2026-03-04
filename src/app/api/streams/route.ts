import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStreamSchema } from "@/lib/validations/stream";
import bcrypt from "bcryptjs";

// GET /api/streams - List streams
export async function GET() {
  const streams = await prisma.stream.findMany({
    where: { status: { in: ["LIVE", "RECORDED"] } },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { viewerSessions: { where: { isActive: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(streams);
}

// POST /api/streams - Create a new stream
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createStreamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, isPasswordProtected, password } = parsed.data;

  let passwordHash: string | null = null;
  if (isPasswordProtected && password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const stream = await prisma.stream.create({
    data: {
      title,
      description,
      isPasswordProtected,
      passwordHash,
      creatorId: session.user.id,
    },
  });

  return NextResponse.json(stream, { status: 201 });
}
