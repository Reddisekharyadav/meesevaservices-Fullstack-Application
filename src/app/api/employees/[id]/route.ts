import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { withSuperAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { Employee } from '@/types';

// GET single employee
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await queryOne<Employee>(
      `SELECT e.id, e.name, e.phone, e.role, e.branchId, e.isActive, e.createdAt,
              b.name as branchName
       FROM Employees e
       LEFT JOIN Branches b ON e.branchId = b.id
       WHERE e.id = @id`,
      { id: parseInt(id) }
    );
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT update employee
export const PUT = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    const body = await req.json();
    const { name, phone, password, role, branchId, isActive } = body;
    
    let sql = `
      UPDATE Employees 
      SET name = @name, phone = @phone, role = @role, 
          branchId = @branchId, isActive = @isActive, updatedAt = GETUTCDATE()
    `;
    
    const params: Record<string, unknown> = {
      id: parseInt(id!),
      name,
      phone,
      role,
      branchId: branchId || null,
      isActive: isActive !== false,
    };
    
    if (password) {
      sql += ', password = @password';
      params.password = await hashPassword(password);
    }
    
    sql += ' WHERE id = @id';
    
    await execute(sql, params);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    );
  }
});

// DELETE employee
export const DELETE = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    // Soft delete by setting isActive to false
    await execute(
      'UPDATE Employees SET isActive = 0, updatedAt = GETUTCDATE() WHERE id = @id',
      { id: parseInt(id!) }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
});
