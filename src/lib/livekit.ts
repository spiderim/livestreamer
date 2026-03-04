import {
  RoomServiceClient,
  IngressClient,
  EgressClient,
} from "livekit-server-sdk";

const livekitUrl = process.env.LIVEKIT_URL!;
const apiKey = process.env.LIVEKIT_API_KEY!;
const apiSecret = process.env.LIVEKIT_API_SECRET!;

// Server SDK needs http(s):// URL, not ws://
const httpUrl = livekitUrl
  .replace("wss://", "https://")
  .replace("ws://", "http://");

export const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);
export const ingressClient = new IngressClient(httpUrl, apiKey, apiSecret);
export const egressClient = new EgressClient(httpUrl, apiKey, apiSecret);
