import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME ?? "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY ?? "";
const containerName = process.env.AZURE_STORAGE_CONTAINER ?? "recordings";

function getCredential() {
  if (!accountName || !accountKey) {
    throw new Error(
      "Azure Storage not configured. Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY."
    );
  }
  return new StorageSharedKeyCredential(accountName, accountKey);
}

function getContainerClient() {
  const credential = getCredential();
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );
  return blobServiceClient.getContainerClient(containerName);
}

export const containerClient = {
  getBlobClient(blobPath: string) {
    return getContainerClient().getBlobClient(blobPath);
  },
};

export function generateSasUrl(blobPath: string, expiresInHours = 4): string {
  const credential = getCredential();
  const client = getContainerClient().getBlobClient(blobPath);
  const startsOn = new Date();
  const expiresOn = new Date(
    startsOn.getTime() + expiresInHours * 60 * 60 * 1000
  );

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn,
    },
    credential
  ).toString();

  return `${client.url}?${sasToken}`;
}
