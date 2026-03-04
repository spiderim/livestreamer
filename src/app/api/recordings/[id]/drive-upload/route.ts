import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToDrive } from "@/lib/google-drive";

interface Context {
  params: Promise<{ id: string }>;
}

// POST /api/recordings/[id]/drive-upload
export async function POST(_req: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const result = await uploadToDrive(id, session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Google Drive upload failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload to Google Drive",
      },
      { status: 500 }
    );
  }
}
