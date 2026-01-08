import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { withEmployeeAuth, AuthenticatedRequest } from '@/lib/middleware';
import { deleteFile, generateSasUrl } from '@/lib/blob';
import { Document } from '@/types';

// GET single document / download URL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await queryOne<Document>(
      `SELECT d.*, c.name as customerName, e.name as uploadedByName
       FROM Documents d
       LEFT JOIN Customers c ON d.customerId = c.id
       LEFT JOIN Employees e ON d.uploadedBy = e.id
       WHERE d.id = @id`,
      { id: parseInt(id) }
    );
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Generate a SAS URL for secure download
    let downloadUrl = document.blobUrl;
    try {
      downloadUrl = await generateSasUrl(document.blobUrl, 60);
    } catch (e) {
      // If SAS generation fails, use public URL
      console.warn('SAS generation failed, using public URL');
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
export const DELETE = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    // Get document to delete from blob storage
    const document = await queryOne<Document>(
      'SELECT blobUrl FROM Documents WHERE id = @id',
      { id: parseInt(id!) }
    );
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Delete from blob storage
    try {
      await deleteFile(document.blobUrl);
    } catch (e) {
      console.warn('Failed to delete blob:', e);
    }
    
    // Delete from database
    await execute('DELETE FROM Documents WHERE id = @id', { id: parseInt(id!) });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
});
