import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ingressClient } from "@/lib/livekit";

interface Context {
  params: Promise<{ id: string }>;
}

// POST /api/streams/[id]/stop
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
  if (stream.status !== "LIVE") {
    return NextResponse.json(
      { error: "Stream is not live" },
      { status: 400 }
    );
  }

  try {
    // Delete the ingress (stops RTMP feed)
    if (stream.livekitIngressId) {
      await ingressClient.deleteIngress(stream.livekitIngressId);
    }

    // Update database
    await prisma.stream.update({
      where: { id },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });

    // Mark all viewer sessions as inactive
    await prisma.viewerSession.updateMany({
      where: { streamId: id, isActive: true },
      data: { isActive: false, leftAt: new Date() },
    });

    // Check if there are other live streams before stopping VM
    const otherLiveStreams = await prisma.stream.count({
      where: { status: "LIVE", id: { not: id } },
    });

    if (
      otherLiveStreams === 0 &&
      process.env.AZURE_SUBSCRIPTION_ID &&
      process.env.AZURE_TENANT_ID
    ) {
      // No other live streams — deallocate VM to save costs
      import("@/lib/azure-vm").then((m) =>
        m.stopLiveKitVM().catch(console.error)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to stop stream:", error);
    return NextResponse.json(
      { error: "Failed to stop stream" },
      { status: 500 }
    );
  }
}
