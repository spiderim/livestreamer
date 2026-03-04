import {
  RoomServiceClient,
  IngressClient,
  EgressClient,
} from "livekit-server-sdk";

function getHttpUrl() {
  const url = process.env.LIVEKIT_URL ?? "";
  return url.replace("wss://", "https://").replace("ws://", "http://");
}

function getKeys() {
  return {
    apiKey: process.env.LIVEKIT_API_KEY ?? "",
    apiSecret: process.env.LIVEKIT_API_SECRET ?? "",
  };
}

export const roomService = new Proxy({} as RoomServiceClient, {
  get(_, prop) {
    const { apiKey, apiSecret } = getKeys();
    const client = new RoomServiceClient(getHttpUrl(), apiKey, apiSecret);
    return (client as Record<string, unknown>)[prop as string];
  },
});

export const ingressClient = new Proxy({} as IngressClient, {
  get(_, prop) {
    const { apiKey, apiSecret } = getKeys();
    const client = new IngressClient(getHttpUrl(), apiKey, apiSecret);
    return (client as Record<string, unknown>)[prop as string];
  },
});

export const egressClient = new Proxy({} as EgressClient, {
  get(_, prop) {
    const { apiKey, apiSecret } = getKeys();
    const client = new EgressClient(getHttpUrl(), apiKey, apiSecret);
    return (client as Record<string, unknown>)[prop as string];
  },
});
