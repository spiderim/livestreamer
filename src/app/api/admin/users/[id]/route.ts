import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Context {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/users/[id] - Remove admin role
export async function DELETE(_req: Request, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.role === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Cannot remove super admin" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id },
    data: { role: "VIEWER" },
  });

  return NextResponse.json({ success: true });
}
