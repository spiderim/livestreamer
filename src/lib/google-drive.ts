import { google } from "googleapis";
import { prisma } from "./prisma";
import { containerClient } from "./blob-storage";

export async function uploadToDrive(streamId: string, adminId: string) {
  // Get admin's OAuth tokens
  const account = await prisma.account.findFirst({
    where: { userId: adminId, provider: "google" },
  });

  if (!account?.refresh_token) {
    throw new Error("Admin Google account not found or missing refresh token");
  }

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  // Auto-refresh tokens and persist
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.account.update({
        where: { id: account.id },
        data: { access_token: tokens.access_token },
      });
    }
  });

  // Get recording from Azure Blob Storage
  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
  });

  if (!stream?.recordingBlobPath) {
    throw new Error("No recording found for this stream");
  }

  const blobClient = containerClient.getBlobClient(stream.recordingBlobPath);
  const downloadResponse = await blobClient.download();

  if (!downloadResponse.readableStreamBody) {
    throw new Error("Failed to download recording from blob storage");
  }

  // Upload to Google Drive
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const file = await drive.files.create({
    requestBody: {
      name: `${stream.title} - ${stream.startedAt?.toISOString() ?? "recording"}.mp4`,
      mimeType: "video/mp4",
    },
    media: {
      mimeType: "video/mp4",
      body: downloadResponse.readableStreamBody,
    },
    fields: "id, webViewLink",
  });

  // Update database with Drive info
  await prisma.stream.update({
    where: { id: streamId },
    data: {
      googleDriveFileId: file.data.id,
      googleDriveUrl: file.data.webViewLink,
    },
  });

  return {
    driveFileId: file.data.id,
    driveUrl: file.data.webViewLink,
  };
}
