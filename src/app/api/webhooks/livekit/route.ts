import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

// POST /api/webhooks/livekit
export async function POST(req: Request) {
  const body = await req.text();
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Missing auth" }, { status: 401 });
  }

  let event;
  try {
    event = await receiver.receive(body, authHeader);
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  const roomName = event.room?.name;
  if (!roomName) {
    return new Response("OK", { status: 200 });
  }

  // Extract stream ID from room name (format: "stream-{id}")
  const streamId = roomName.replace("stream-", "");

  try {
    switch (event.event) {
      case "participant_joined": {
        const participantId = event.participant?.identity;
        if (participantId && !participantId.startsWith("streamer-")) {
          await prisma.viewerSession.create({
            data: {
              streamId,
              userId: participantId,
              isActive: true,
            },
          });
        }
        break;
      }

      case "participant_left": {
        const participantId = event.participant?.identity;
        if (participantId && !participantId.startsWith("streamer-")) {
          await prisma.viewerSession.updateMany({
            where: { streamId, userId: participantId, isActive: true },
            data: { isActive: false, leftAt: new Date() },
          });
        }
        break;
      }

      case "room_started": {
        await prisma.stream.update({
          where: { id: streamId },
          data: { status: "LIVE", startedAt: new Date() },
        });
        break;
      }

      case "room_finished": {
        await prisma.stream.update({
          where: { id: streamId },
          data: { status: "ENDED", endedAt: new Date() },
        });
        await prisma.viewerSession.updateMany({
          where: { streamId, isActive: true },
          data: { isActive: false, leftAt: new Date() },
        });
        break;
      }

      case "egress_ended": {
        const egressInfo = event.egressInfo;
        const fileResult = egressInfo?.fileResults?.[0];
        if (fileResult) {
          await prisma.stream.update({
            where: { id: streamId },
            data: {
              status: "RECORDED",
              recordingBlobPath: fileResult.filename,
              duration: fileResult.duration
                ? Math.floor(Number(fileResult.duration) / 1_000_000_000)
                : null,
            },
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
  }

  return new Response("OK", { status: 200 });
}
