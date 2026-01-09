import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withSuperAdminAuth, withEmployeeAuth, AuthenticatedRequest } from '@/lib/middleware';
import { Branch } from '@/types';

// GET all branches
export async function GET(req: NextRequest) {
  try {
    const branches = await query<Branch>(
      'SELECT * FROM Branches ORDER BY name'
    );
    
    return NextResponse.json({ success: true, data: branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

// POST create new branch (super admin only)
export const POST = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { name, code, address } = body;
    
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      );
    }
    
    // Get the logged-in admin's phone number from database
    const adminData = await queryOne<{ phone: string }>(
      `SELECT phone FROM Employees WHERE id = @adminId`,
      { adminId: req.user.id }
    );
    const adminPhone = adminData?.phone || null;
    
    const result = await execute(
      `INSERT INTO Branches (name, code, address, phone) 
       OUTPUT INSERTED.id
       VALUES (@name, @code, @address, @phone)`,
      { name, code, address: address || null, phone: adminPhone }
    );
    
    const insertedId = (result.recordset as { id: number }[])[0]?.id;
    
    return NextResponse.json({
      success: true,
      data: { id: insertedId, name, code, address, phone: adminPhone },
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    );
  }
});
