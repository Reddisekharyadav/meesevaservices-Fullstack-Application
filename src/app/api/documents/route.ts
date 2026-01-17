import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { withEmployeeAuth, AuthenticatedRequest } from '@/lib/middleware';
import { uploadFile } from '@/lib/blob';
import { Document } from '@/types';

// GET all documents for current tenant
export const GET = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  console.log('🔥 GET /api/documents HIT');

  try {
    console.log('👤 Auth user:', req.user);

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const branchId = searchParams.get('branchId');
    const tenantId = req.user.tenantId;

    console.log('🔎 Query params:', {
      tenantId,
      customerId,
      branchId,
    });

    let sql = `
      SELECT d.id, d.customerId, d.originalName, d.blobName, d.fileSize, d.createdAt,
             c.name as customerName
      FROM Documents d
      LEFT JOIN Customers c ON d.customerId = c.id
      WHERE d.tenantId = @tenantId
    `;

    const params: Record<string, unknown> = { tenantId };

    console.log('🧠 Base SQL:', sql);
    console.log('🧠 Base params:', params);

    if (customerId) {
      sql += ' AND d.customerId = @customerId';
      params.customerId = parseInt(customerId);
      console.log('➕ Added customerId filter:', customerId);
    }

    if (branchId) {
      sql += ' AND c.branchId = @branchId';
      params.branchId = parseInt(branchId);
      console.log('➕ Added branchId filter:', branchId);
    }

    sql += ' ORDER BY d.createdAt DESC';

    console.log('🧠 Final SQL:', sql);
    console.log('📌 Final params:', params);

    const documents = await query<Document>(sql, params);

    console.log('📦 Documents count:', documents.length);
    console.log('📦 First document:', documents[0]);

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
});

// POST upload new document
export const POST = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  console.log('🔥 POST /api/documents HIT');

  try {
    console.log('👤 Auth user:', req.user);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const customerId = formData.get('customerId') as string;

    console.log('📥 FormData:', {
      hasFile: !!file,
      customerId,
      fileName: file?.name,
      fileSize: file?.size,
    });

    if (!file || !customerId) {
      console.warn('⚠️ Missing file or customerId');
      return NextResponse.json(
        { success: false, error: 'File and customer ID are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('☁️ Uploading to Azure Blob...');
    const uploadResult = await uploadFile(
      buffer,
      file.name,
      parseInt(customerId)
    );

    console.log('✅ Blob upload result:', uploadResult);

    console.log('💾 Inserting document into DB...');
    const result = await execute(
      `INSERT INTO Documents (customerId, originalName, blobName, fileSize)
       OUTPUT INSERTED.id
       VALUES (@customerId, @originalName, @blobName, @fileSize)`,
      {
        customerId: parseInt(customerId),
        tenantId: req.user.tenantId,
        originalName: uploadResult.originalFileName,
        blobName: uploadResult.blobName,
        fileSize: uploadResult.fileSize,
      }
    );

    const insertedId = (result.recordset as { id: number }[])[0]?.id;

    console.log('✅ Document inserted with ID:', insertedId);

    return NextResponse.json({
      success: true,
      data: {
        id: insertedId,
        originalName: uploadResult.originalFileName,
        blobName: uploadResult.blobName,
        blobUrl: uploadResult.blobUrl,
      },
    });
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
});
