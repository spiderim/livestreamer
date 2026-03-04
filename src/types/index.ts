export type UserRole = "VIEWER" | "ADMIN" | "SUPER_ADMIN";

export type StreamStatus = "PENDING" | "LIVE" | "ENDED" | "RECORDED" | "FAILED";

export interface StreamWithCreator {
  id: string;
  title: string;
  description: string | null;
  status: StreamStatus;
  isPasswordProtected: boolean;
  shareableSlug: string;
  thumbnailUrl: string | null;
  duration: number | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    viewerSessions: number;
  };
}

export interface ChatMessageWithUser {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface ViewerWithUser {
  id: string;
  joinedAt: Date;
  isActive: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}
