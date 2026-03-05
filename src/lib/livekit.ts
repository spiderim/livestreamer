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

function lazyClient<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_, prop) {
      const client = factory();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (client as Record<string, any>)[prop as string];
    },
  });
}

export const roomService = lazyClient(
  () => new RoomServiceClient(getHttpUrl(), getKeys().apiKey, getKeys().apiSecret)
);

export const ingressClient = lazyClient(
  () => new IngressClient(getHttpUrl(), getKeys().apiKey, getKeys().apiSecret)
);

export const egressClient = lazyClient(
  () => new EgressClient(getHttpUrl(), getKeys().apiKey, getKeys().apiSecret)
);
