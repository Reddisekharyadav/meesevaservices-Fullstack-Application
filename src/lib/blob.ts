import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerClient,
} from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents';

let containerClient: ContainerClient | null = null;

async function getContainerClient(): Promise<ContainerClient> {
  if (containerClient) {
    return containerClient;
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Create container if it doesn't exist (private access)
  await containerClient.createIfNotExists();
  
  return containerClient;
}

export interface UploadResult {
  blobUrl: string;
  blobName: string;
  originalFileName: string;
  fileSize: number;
}

export async function uploadFile(
  file: Buffer,
  originalFileName: string,
  customerId: number
): Promise<UploadResult> {
  const container = await getContainerClient();
  
  // Generate unique filename
  const extension = originalFileName.split('.').pop()?.toLowerCase() || 'pdf';
  const uniqueFileName = `${customerId}/${uuidv4()}.${extension}`;
  
  const blockBlobClient = container.getBlockBlobClient(uniqueFileName);
  
  // Determine content type based on file extension
  let contentType = 'application/octet-stream';
  
  if (extension === 'pdf') {
    contentType = 'application/pdf';
  } else if (['jpg', 'jpeg'].includes(extension)) {
    contentType = 'image/jpeg';
  } else if (extension === 'png') {
    contentType = 'image/png';
  } else if (extension === 'gif') {
    contentType = 'image/gif';
  } else if (extension === 'webp') {
    contentType = 'image/webp';
  }
  
  await blockBlobClient.upload(file, file.length, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });
  
  // Generate SAS URL for private access
  const sasUrl = await generateSasUrlForBlob(uniqueFileName, 60 * 24 * 7); // 7 days expiry
  
  return {
    blobUrl: sasUrl,
    blobName: uniqueFileName,
    originalFileName: originalFileName,
    fileSize: file.length,
  };
}

export async function deleteFile(blobUrl: string): Promise<void> {
  const container = await getContainerClient();
  
  // Extract blob name from URL
  const url = new URL(blobUrl);
  const blobName = url.pathname.replace(`/${containerName}/`, '');
  
  const blockBlobClient = container.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

export async function getDownloadUrl(blobUrl: string): Promise<string> {
  // For private containers, generate a SAS token
  const container = await getContainerClient();
  
  // Extract blob name from URL
  const url = new URL(blobUrl.split('?')[0]); // Remove any existing SAS token
  const blobName = url.pathname.replace(`/${containerName}/`, '');
  
  return await generateSasUrlForBlob(blobName, 60); // 1 hour expiry
}

// Helper function to generate SAS URL for a blob name
export async function generateSasUrlForBlob(blobName: string, expiryMinutes: number = 60): Promise<string> {
  const container = await getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  // Generate SAS token
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + expiryMinutes);
  
  const sasUrl = await blockBlobClient.generateSasUrl({
    permissions: BlobSASPermissions.parse('r'),
    expiresOn: expiryDate,
  });
  
  return sasUrl;
}

export async function generateSasUrl(blobUrl: string, expiryMinutes: number = 60): Promise<string> {
  // Extract blob name from URL
  const url = new URL(blobUrl.split('?')[0]); // Remove any existing SAS token
  const blobName = url.pathname.replace(`/${containerName}/`, '');
  
  return await generateSasUrlForBlob(blobName, expiryMinutes);
}

export async function listCustomerFiles(customerId: number): Promise<string[]> {
  const container = await getContainerClient();
  const files: string[] = [];
  
  for await (const blob of container.listBlobsFlat({ prefix: `${customerId}/` })) {
    files.push(blob.name);
  }
  
  return files;
}
