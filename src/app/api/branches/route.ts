import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
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
    const { name, city, address } = body;
    
    if (!name || !city) {
      return NextResponse.json(
        { success: false, error: 'Name and city are required' },
        { status: 400 }
      );
    }
    
    const result = await execute(
      `INSERT INTO Branches (name, city, address) 
       OUTPUT INSERTED.id
       VALUES (@name, @city, @address)`,
      { name, city, address: address || null }
    );
    
    const insertedId = (result.recordset as { id: number }[])[0]?.id;
    
    return NextResponse.json({
      success: true,
      data: { id: insertedId, name, city, address },
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    );
  }
});
