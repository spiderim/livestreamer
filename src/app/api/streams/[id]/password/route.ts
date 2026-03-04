import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface Context {
  params: Promise<{ id: string }>;
}

// POST /api/streams/[id]/password - Verify stream password
export async function POST(req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Super admin bypasses password check
  if (session.user.role === "SUPER_ADMIN") {
    return NextResponse.json({ success: true });
  }

  const { id } = await params;
  const { password } = await req.json();

  const stream = await prisma.stream.findUnique({
    where: { id },
    select: { isPasswordProtected: true, passwordHash: true },
  });

  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  if (!stream.isPasswordProtected) {
    return NextResponse.json({ success: true });
  }

  if (!stream.passwordHash || !password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const isValid = await bcrypt.compare(password, stream.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
