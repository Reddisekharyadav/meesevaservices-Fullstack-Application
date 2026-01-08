import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { withSuperAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { Branch } from '@/types';

// GET single branch
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const branch = await queryOne<Branch>(
      'SELECT * FROM Branches WHERE id = @id',
      { id: parseInt(id) }
    );
    
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: branch });
  } catch (error) {
    console.error('Error fetching branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

// PUT update branch (super admin only)
export const PUT = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    const body = await req.json();
    const { name, code, address, phone } = body;
    
    await execute(
      `UPDATE Branches 
       SET name = @name, code = @code, address = @address, phone = @phone, updatedAt = GETUTCDATE()
       WHERE id = @id`,
      { id: parseInt(id!), name, code, address, phone }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update branch' },
      { status: 500 }
    );
  }
});

// DELETE branch (super admin only)
export const DELETE = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    await execute('DELETE FROM Branches WHERE id = @id', { id: parseInt(id!) });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
});
