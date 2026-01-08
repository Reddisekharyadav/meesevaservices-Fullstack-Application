import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { DailyReport, BranchReport } from '@/types';

// GET reports
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'daily';
    const branchId = searchParams.get('branchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (type === 'daily') {
      // Daily summary report - using Payments table for payment data
      let sql = `
        SELECT 
          CAST(p.createdAt AS DATE) as date,
          SUM(p.amount) as totalAmount,
          SUM(CASE WHEN p.mode = 'cash' THEN p.amount ELSE 0 END) as cashAmount,
          SUM(CASE WHEN p.mode = 'upi' THEN p.amount ELSE 0 END) as upiAmount,
          SUM(CASE WHEN p.mode = 'test' THEN p.amount ELSE 0 END) as testAmount,
          COUNT(*) as workCount
        FROM Payments p
        WHERE p.status = 'completed'
      `;
      
      const params: Record<string, unknown> = {};
      
      if (branchId) {
        sql += ' AND p.customerId IN (SELECT id FROM Customers WHERE branchId = @branchId)';
        params.branchId = parseInt(branchId);
      }
      
      if (startDate && endDate) {
        sql += ' AND p.createdAt >= @startDate AND p.createdAt <= @endDate';
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      sql += ' GROUP BY CAST(p.createdAt AS DATE) ORDER BY date DESC';
      
      const reports = await query<DailyReport>(sql, params);
      
      return NextResponse.json({ success: true, data: reports });
    } else if (type === 'branch') {
      // Branch-wise summary
      let sql = `
        SELECT 
          b.id as branchId,
          b.name as branchName,
          ISNULL(SUM(w.amount), 0) as totalAmount,
          COUNT(w.id) as workCount,
          (SELECT COUNT(*) FROM Customers c WHERE c.branchId = b.id AND c.isActive = 1) as customerCount
        FROM Branches b
        LEFT JOIN WorkEntries w ON b.id = w.branchId AND w.status = 'completed'
      `;
      
      const params: Record<string, unknown> = {};
      
      if (startDate && endDate) {
        sql += ' AND w.createdAt >= @startDate AND w.createdAt <= @endDate';
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      sql += ' GROUP BY b.id, b.name ORDER BY b.name';
      
      const reports = await query<BranchReport>(sql, params);
      
      return NextResponse.json({ success: true, data: reports });
    } else if (type === 'summary') {
      // Overall summary
      const params: Record<string, unknown> = {};
      let whereClause = '';
      
      if (branchId) {
        whereClause = ' AND branchId = @branchId';
        params.branchId = parseInt(branchId);
      }
      
      if (startDate && endDate) {
        whereClause += ' AND createdAt >= @startDate AND createdAt <= @endDate';
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      const summaryData = await query<{
        totalRevenue: number;
        totalWorks: number;
        totalCustomers: number;
        totalDocuments: number;
      }>(`
        SELECT 
          (SELECT ISNULL(SUM(amount), 0) FROM WorkEntries WHERE status = 'completed' ${whereClause}) as totalRevenue,
          (SELECT COUNT(*) FROM WorkEntries WHERE 1=1 ${whereClause}) as totalWorks,
          (SELECT COUNT(*) FROM Customers WHERE isActive = 1) as totalCustomers,
          (SELECT COUNT(*) FROM Documents) as totalDocuments
      `, params);
      
      return NextResponse.json({ success: true, data: summaryData[0] });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid report type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}
