import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withSuperAdminAuth, withEmployeeAuth, AuthenticatedRequest } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { Employee } from '@/types';

// GET all employees for current tenant
export const GET = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const tenantId = req.user.tenantId;
    
    let sql = `
      SELECT e.id, e.name, e.email, e.phone, e.role, e.branchId, e.isActive, e.createdAt, 
             b.name as branchName
      FROM Employees e
      LEFT JOIN Branches b ON e.branchId = b.id
      WHERE e.tenantId = @tenantId
    `;
    
    const params: Record<string, unknown> = { tenantId };
    
    if (branchId) {
      sql += ' AND e.branchId = @branchId';
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
});

// POST create new employee (super admin only)
export const POST = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { name, email, password, role, branchId } = body;
    
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }
    
    // Get the logged-in admin's phone number from database
    const adminData = await queryOne<{ phone: string }>(
      `SELECT phone FROM Employees WHERE id = @adminId`,
      { adminId: req.user.id }
    );
    const adminPhone = adminData?.phone || null;
    
    // Check if email already exists
    const existingEmail = await queryOne<Employee>(
      'SELECT id FROM Employees WHERE email = @email',
      { email }
    );
    
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    const hashedPassword = await hashPassword(password);
    
    const result = await execute(
      `INSERT INTO Employees (name, phone, email, passwordHash, role, branchId)
       OUTPUT INSERTED.id
       VALUES (@name, @phone, @email, @passwordHash, @role, @branchId)`,
      {
        name,
        phone: adminPhone,
        email,
        passwordHash: hashedPassword,
        role,
        branchId: branchId || null,
      }
    );
    
    const insertedId = (result.recordset as { id: number }[])[0]?.id;
    
    return NextResponse.json({
      success: true,
      data: { id: insertedId, name, phone: adminPhone, email, role, branchId },
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    );
  }
});
