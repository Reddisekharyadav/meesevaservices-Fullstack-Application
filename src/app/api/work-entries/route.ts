import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { withEmployeeAuth, AuthenticatedRequest } from '@/lib/middleware';
import { WorkEntry } from '@/types';

// GET all work entries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const customerId = searchParams.get('customerId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let sql = `
      SELECT w.id, w.customerId, w.branchId, w.employeeId, w.description,
             w.amount, w.status, w.createdAt,
             c.name as customerName, b.name as branchName, e.name as employeeName
      FROM WorkEntries w
      LEFT JOIN Customers c ON w.customerId = c.id
      LEFT JOIN Branches b ON w.branchId = b.id
      LEFT JOIN Employees e ON w.employeeId = e.id
      WHERE 1=1
    `;
    
    const params: Record<string, unknown> = {};
    
    if (branchId) {
      sql += ' AND w.branchId = @branchId';
      params.branchId = parseInt(branchId);
    }
    
    if (customerId) {
      sql += ' AND w.customerId = @customerId';
      params.customerId = parseInt(customerId);
    }
    
    if (date) {
      sql += ' AND CAST(w.createdAt AS DATE) = @date';
      params.date = date;
    }
    
    if (startDate && endDate) {
      sql += ' AND w.createdAt >= @startDate AND w.createdAt <= @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    sql += ' ORDER BY w.createdAt DESC';
    
    const entries = await query<WorkEntry>(sql, params);
    
    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error('Error fetching work entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work entries' },
      { status: 500 }
    );
  }
}

// POST create new work entry
export const POST = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { customerId, description, amount, branchId } = body;
    
    if (!customerId || !description) {
      return NextResponse.json(
        { success: false, error: 'Customer and description are required' },
        { status: 400 }
      );
    }
    
    const effectiveBranchId = branchId || req.user.branchId;
    
    // Check branch access for non-super admins
    if (req.user.role !== 'superAdmin' && req.user.branchId !== effectiveBranchId) {
      return NextResponse.json(
        { success: false, error: 'Cannot create work entry for another branch' },
        { status: 403 }
      );
    }
    
    const result = await execute(
      `INSERT INTO WorkEntries (customerId, branchId, employeeId, description, amount, status)
       OUTPUT INSERTED.id
       VALUES (@customerId, @branchId, @employeeId, @description, @amount, @status)`,
      {
        customerId,
        branchId: effectiveBranchId,
        employeeId: req.user.id,
        description,
        amount: amount || 0,
        status: 'pending',
      }
    );
    
    const insertedId = (result.recordset as { id: number }[])[0]?.id;
    
    return NextResponse.json({
      success: true,
      data: { id: insertedId },
    });
  } catch (error) {
    console.error('Error creating work entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create work entry' },
      { status: 500 }
    );
  }
});
