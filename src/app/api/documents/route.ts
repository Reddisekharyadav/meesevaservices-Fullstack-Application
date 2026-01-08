import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { withEmployeeAuth, AuthenticatedRequest } from '@/lib/middleware';
import { uploadFile } from '@/lib/blob';
import { Document } from '@/types';

// GET all documents
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const branchId = searchParams.get('branchId');
    
    let sql = `
      SELECT d.id, d.customerId, d.fileName, d.blobUrl, d.uploadedBy, d.fileSize, d.createdAt,
             c.name as customerName, e.name as uploadedByName
      FROM Documents d
      LEFT JOIN Customers c ON d.customerId = c.id
      LEFT JOIN Employees e ON d.uploadedBy = e.id
      WHERE 1=1
    `;
    
    const params: Record<string, unknown> = {};
    
    if (customerId) {
      sql += ' AND d.customerId = @customerId';
      params.customerId = parseInt(customerId);
    }
    
    if (branchId) {
      sql += ' AND c.branchId = @branchId';
      params.branchId = parseInt(branchId);
    }
    
    sql += ' ORDER BY d.createdAt DESC';
    
    const documents = await query<Document>(sql, params);
    
    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST upload new document
export const POST = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const customerId = formData.get('customerId') as string;
    
    if (!file || !customerId) {
      return NextResponse.json(
        { success: false, error: 'File and customer ID are required' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Azure Blob Storage
    const uploadResult = await uploadFile(buffer, file.name, parseInt(customerId));
    
    // Save document record to database
    const result = await execute(
      `INSERT INTO Documents (customerId, fileName, blobUrl, uploadedBy, fileSize)
       OUTPUT INSERTED.id
       VALUES (@customerId, @fileName, @blobUrl, @uploadedBy, @fileSize)`,
      {
        customerId: parseInt(customerId),
        fileName: uploadResult.fileName,
        blobUrl: uploadResult.blobUrl,
        uploadedBy: req.user.id,
        fileSize: uploadResult.fileSize,
      }
    );
    
    const insertedId = (result.recordset as { id: number }[])[0]?.id;
    
    return NextResponse.json({
      success: true,
      data: {
        id: insertedId,
        fileName: uploadResult.fileName,
        blobUrl: uploadResult.blobUrl,
      },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
});
