import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateStreamSchema } from "@/lib/validations/stream";
import bcrypt from "bcryptjs";

interface Context {
  params: Promise<{ id: string }>;
}

// GET /api/streams/[id]
export async function GET(_req: Request, { params }: Context) {
  const { id } = await params;

  const stream = await prisma.stream.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { viewerSessions: { where: { isActive: true } } } },
    },
  });

  if (!stream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(stream);
}

// PATCH /api/streams/[id]
export async function PATCH(req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateStreamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };

  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const stream = await prisma.stream.update({
    where: { id },
    data,
  });

  return NextResponse.json(stream);
}

// DELETE /api/streams/[id]
export async function DELETE(_req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.stream.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
