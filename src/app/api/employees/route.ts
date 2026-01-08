import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withSuperAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { Employee } from '@/types';

// GET all employees
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    
    let sql = `
      SELECT e.id, e.name, e.phone, e.role, e.branchId, e.isActive, e.createdAt, 
             b.name as branchName
      FROM Employees e
      LEFT JOIN Branches b ON e.branchId = b.id
    `;
    
    const params: Record<string, unknown> = {};
    
    if (branchId) {
      sql += ' WHERE e.branchId = @branchId';
      params.branchId = parseInt(branchId);
    }
    
    sql += ' ORDER BY e.name';
    
    const employees = await query<Employee>(sql, params);
    
    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST create new employee (super admin only)
export const POST = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { name, phone, password, role, branchId } = body;
    
    if (!name || !phone || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, password, and role are required' },
        { status: 400 }
      );
    }
    
    // Check if phone already exists
    const existing = await queryOne<Employee>(
      'SELECT id FROM Employees WHERE phone = @phone',
      { phone }
    );
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Phone number already registered' },
        { status: 400 }
      );
    }
    
    const hashedPassword = await hashPassword(password);
    
    const result = await execute(
      `INSERT INTO Employees (name, phone, password, role, branchId)
       OUTPUT INSERTED.id
       VALUES (@name, @phone, @password, @role, @branchId)`,
      {
        name,
        phone,
        password: hashedPassword,
        role,
        branchId: branchId || null,
      }
    );
    
    const insertedId = (result.recordset as { id: number }[])[0]?.id;
    
    return NextResponse.json({
      success: true,
      data: { id: insertedId, name, phone, role, branchId },
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    );
  }
});
