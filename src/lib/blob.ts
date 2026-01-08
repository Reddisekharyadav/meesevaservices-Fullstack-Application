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
  
  // Create container if it doesn't exist
  await containerClient.createIfNotExists({
    access: 'blob',
  });
  
  return containerClient;
}

export interface UploadResult {
  blobUrl: string;
  fileName: string;
  fileSize: number;
}

export async function uploadFile(
  file: Buffer,
  originalFileName: string,
  customerId: number
): Promise<UploadResult> {
  const container = await getContainerClient();
  
  // Generate unique filename
  const extension = originalFileName.split('.').pop() || 'pdf';
  const uniqueFileName = `${customerId}/${uuidv4()}.${extension}`;
  
  const blockBlobClient = container.getBlockBlobClient(uniqueFileName);
  
  await blockBlobClient.upload(file, file.length, {
    blobHTTPHeaders: {
      blobContentType: 'application/pdf',
    },
  });
  
  return {
    blobUrl: blockBlobClient.url,
    fileName: originalFileName,
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
  // For public containers, the blob URL is directly accessible
  // For private containers, you would generate a SAS token here
  return blobUrl;
}

export async function generateSasUrl(blobUrl: string, expiryMinutes: number = 60): Promise<string> {
  const container = await getContainerClient();
  
  // Extract blob name from URL
  const url = new URL(blobUrl);
  const blobName = url.pathname.replace(`/${containerName}/`, '');
  
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

export async function listCustomerFiles(customerId: number): Promise<string[]> {
  const container = await getContainerClient();
  const files: string[] = [];
  
  for await (const blob of container.listBlobsFlat({ prefix: `${customerId}/` })) {
    files.push(blob.name);
  }
  
  return files;
}
