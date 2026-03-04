import { AccessToken } from "livekit-server-sdk";

const apiKey = process.env.LIVEKIT_API_KEY!;
const apiSecret = process.env.LIVEKIT_API_SECRET!;

export async function createViewerToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<string> {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
  });
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: false,
    canSubscribe: true,
    canPublishData: true, // for chat via data channels
  });
  return await token.toJwt();
}

export async function createStreamerToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<string> {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
  });
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return await token.toJwt();
}
