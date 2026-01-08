import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { Customer } from '@/types';

// GET all customers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const search = searchParams.get('search');
    
    let sql = `
      SELECT c.id, c.name, c.phone, c.username, c.branchId, c.isActive, c.createdAt,
             b.name as branchName
      FROM Customers c
      LEFT JOIN Branches b ON c.branchId = b.id
      WHERE 1=1
    `;
    
    const params: Record<string, unknown> = {};
    
    if (branchId) {
      sql += ' AND c.branchId = @branchId';
      params.branchId = parseInt(branchId);
    }
    
    if (search) {
      sql += ' AND (c.name LIKE @search OR c.phone LIKE @search OR c.username LIKE @search)';
      params.search = `%${search}%`;
    }
    
    sql += ' ORDER BY c.name';
    
    const customers = await query<Customer>(sql, params);
    
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST create new customer (admin only)
export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { name, phone, username, password, branchId } = body;
    
    if (!name || !phone || !username || !password || !branchId) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Check if branch admin can only create for their branch
    if (req.user.role === 'branch_admin' && req.user.branchId !== branchId) {
      return NextResponse.json(
        { success: false, error: 'Cannot create customer for another branch' },
        { status: 403 }
      );
    }
    
    // Check if username already exists
    const existing = await queryOne<Customer>(
      'SELECT id FROM Customers WHERE username = @username',
      { username }
    );
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 400 }
      );
    }
    
    const hashedPassword = await hashPassword(password);
    
    const result = await execute(
      `INSERT INTO Customers (name, phone, username, password, branchId)
       OUTPUT INSERTED.id
       VALUES (@name, @phone, @username, @password, @branchId)`,
      {
        name,
        phone,
        username,
        password: hashedPassword,
        branchId,
      }
    );
    
    const insertedId = (result.recordset as { id: number }[])[0]?.id;
    
    return NextResponse.json({
      success: true,
      data: { id: insertedId, name, phone, username, branchId },
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
});
