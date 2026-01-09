import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { Customer } from '@/types';

// GET single customer
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await queryOne<Customer>(
      `SELECT c.id, c.name, c.phone, c.username, c.branchId, c.isActive, c.createdAt,
              b.name as branchName
       FROM Customers c
       LEFT JOIN Branches b ON c.branchId = b.id
       WHERE c.id = @id`,
      { id: parseInt(id) }
    );
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT update customer
export const PUT = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    const body = await req.json();
    const { name, phone, username, password, branchId, isActive } = body;
    
    // Get current customer to check branch
    const current = await queryOne<Customer>(
      'SELECT branchId FROM Customers WHERE id = @id',
      { id: parseInt(id!) }
    );
    
    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check branch access
    if (req.user.role === 'branchAdmin' && req.user.branchId !== current.branchId) {
      return NextResponse.json(
        { success: false, error: 'Cannot update customer from another branch' },
        { status: 403 }
      );
    }
    
    let sql = `
      UPDATE Customers 
      SET name = @name, phone = @phone, username = @username,
          branchId = @branchId, isActive = @isActive, updatedAt = GETUTCDATE()
    `;
    
    const params: Record<string, unknown> = {
      id: parseInt(id!),
      name,
      phone,
      username,
      branchId,
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
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
});

// DELETE customer
export const DELETE = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    // Soft delete
    await execute(
      'UPDATE Customers SET isActive = 0, updatedAt = GETUTCDATE() WHERE id = @id',
      { id: parseInt(id!) }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
});
