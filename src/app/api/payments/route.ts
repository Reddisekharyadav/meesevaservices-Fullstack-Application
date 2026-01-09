import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { Payment } from '@/types';

// GET all payments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const branchId = searchParams.get('branchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let sql = `
      SELECT p.id, p.customerId, p.workEntryId, p.amount, p.mode, p.status,
             p.razorpayOrderId, p.razorpayPaymentId, p.notes, p.createdAt,
             c.name as customerName
      FROM Payments p
      LEFT JOIN Customers c ON p.customerId = c.id
      WHERE 1=1
    `;
    
    const params: Record<string, unknown> = {};
    
    if (customerId) {
      sql += ' AND p.customerId = @customerId';
      params.customerId = parseInt(customerId);
    }
    
    if (branchId) {
      sql += ' AND c.branchId = @branchId';
      params.branchId = parseInt(branchId);
    }
    
    if (startDate && endDate) {
      sql += ' AND p.createdAt >= @startDate AND p.createdAt <= @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    sql += ' ORDER BY p.createdAt DESC';
    
    const payments = await query<Payment>(sql, params);
    
    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST create new payment (manual recording)
export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { customerId, workEntryId, amount, mode, notes } = body;
    
    if (!customerId || !amount || !mode) {
      return NextResponse.json(
        { success: false, error: 'Customer, amount, and mode are required' },
        { status: 400 }
      );
    }
    
    const result = await execute(
      `INSERT INTO Payments (customerId, workEntryId, amount, mode, status, notes)
       OUTPUT INSERTED.id
       VALUES (@customerId, @workEntryId, @amount, @mode, 'completed', @notes)`,
      {
        customerId,
        workEntryId: workEntryId || null,
        amount,
        mode,
        notes: notes || null,
      }
    );
    
    const insertedId = (result.recordset as { id: number }[])[0]?.id;
    
    // If no work entry is linked, auto-create one
    if (!workEntryId) {
      try {
        // Get customer details for work entry
        const customer = await queryOne<{ name: string; branchId: number }>(
          'SELECT name, branchId FROM Customers WHERE id = @id',
          { id: customerId }
        );
        
        if (customer) {
          await execute(
            `INSERT INTO WorkEntries (customerId, branchId, employeeId, description, amount, status)
             VALUES (@customerId, @branchId, @employeeId, @description, @amount, 'completed')`,
            {
              customerId,
              branchId: customer.branchId,
              employeeId: req.user.id,
              description: `Payment received - ${customer.name}`,
              amount: amount,
            }
          );
        }
      } catch (workEntryError) {
        console.warn('Failed to create auto work entry for payment:', workEntryError);
      }
    }
    
    // Update work entry status if linked
    if (workEntryId) {
      await execute(
        `UPDATE WorkEntries SET status = 'completed' WHERE id = @id`,
        { id: workEntryId }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { id: insertedId },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
});
