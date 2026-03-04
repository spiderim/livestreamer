export interface StreamFormData {
  title: string;
  description?: string;
  isPasswordProtected: boolean;
  password?: string;
}

export interface StartStreamResponse {
  rtmpUrl: string;
  streamKey: string;
  shareableLink: string;
}

export interface StreamTokenResponse {
  token: string;
  wsUrl: string;
}
