import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { withEmployeeAuth, AuthenticatedRequest } from '@/lib/middleware';
import { deleteFile, generateSasUrl } from '@/lib/blob';
import { verifyToken } from '@/lib/auth';
import { Document } from '@/types';

// Helper function to verify auth token
async function verifyAuth(token: string) {
  return await verifyToken(token);
}

// GET single document / download URL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication manually since middleware doesn't support params
    const token = req.cookies.get('seva_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifyAuth(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const document = await queryOne<Document>(
      `SELECT d.* FROM Documents d
       LEFT JOIN Customers c ON d.customerId = c.id
       WHERE d.id = @id AND d.tenantId = @tenantId`,
      { id: parseInt(id), tenantId: user.tenantId }
    );
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Generate a SAS URL for secure download
    let downloadUrl: string;
    try {
      // Construct the full blob URL from the blob name
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
      const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents';
      const accountName = connectionString.split('AccountName=')[1]?.split(';')[0];
      const fullBlobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${document.blobName}`;
      
      downloadUrl = await generateSasUrl(fullBlobUrl, 60);
    } catch (e) {
      console.error('SAS generation failed:', e);
      // Return an error instead of falling back to public URL
      return NextResponse.json(
        { success: false, error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...document,
        downloadUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// DELETE document
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication manually since middleware doesn't support params
    const token = req.cookies.get('seva_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifyAuth(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role permission
    if (!['superAdmin', 'branchAdmin', 'employee'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // Get document to delete from blob storage - with tenant check
    const document = await queryOne<Document>(
      'SELECT blobName FROM Documents WHERE id = @id AND tenantId = @tenantId',
      { id: parseInt(id), tenantId: user.tenantId }
    );
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Delete from blob storage
    try {
      // Construct full blob URL for deletion
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
      const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents';
      const accountName = connectionString.split('AccountName=')[1]?.split(';')[0];
      const fullBlobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${document.blobName}`;
      
      await deleteFile(fullBlobUrl);
    } catch (e) {
      console.warn('Failed to delete blob:', e);
    }
    
    // Delete from database
    await execute('DELETE FROM Documents WHERE id = @id AND tenantId = @tenantId', { id: parseInt(id), tenantId: user.tenantId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
