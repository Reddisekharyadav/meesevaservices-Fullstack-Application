import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { withEmployeeAuth, AuthenticatedRequest } from '@/lib/middleware';
import { WorkEntry } from '@/types';

// GET single work entry
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await queryOne<WorkEntry>(
      `SELECT w.*, c.name as customerName, e.name as employeeName, b.name as branchName
       FROM WorkEntries w
       LEFT JOIN Customers c ON w.customerId = c.id
       LEFT JOIN Employees e ON w.employeeId = e.id
       LEFT JOIN Branches b ON w.branchId = b.id
       WHERE w.id = @id`,
      { id: parseInt(id) }
    );
    
    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Work entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error fetching work entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work entry' },
      { status: 500 }
    );
  }
}

// PUT update work entry
export const PUT = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    const body = await req.json();
    const { description, amount, paymentMode, status } = body;
    
    await execute(
      `UPDATE WorkEntries 
       SET description = @description, amount = @amount, 
           paymentMode = @paymentMode, status = @status, updatedAt = GETUTCDATE()
       WHERE id = @id`,
      {
        id: parseInt(id!),
        description,
        amount: amount || 0,
        paymentMode: paymentMode || 'pending',
        status: status || 'pending',
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating work entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update work entry' },
      { status: 500 }
    );
  }
});

// DELETE work entry
export const DELETE = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    await execute('DELETE FROM WorkEntries WHERE id = @id', { id: parseInt(id!) });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete work entry' },
      { status: 500 }
    );
  }
});
