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
      // Branch-wise summary using Payments table
      let sql = `
        SELECT 
          b.id as branchId,
          b.name as branchName,
          ISNULL(SUM(p.amount), 0) as totalAmount,
          COUNT(p.id) as paymentCount,
          (SELECT COUNT(*) FROM Customers c WHERE c.branchId = b.id AND c.isActive = 1) as customerCount,
          (SELECT COUNT(*) FROM WorkEntries w WHERE w.branchId = b.id) as workCount
        FROM Branches b
        LEFT JOIN Customers c ON b.id = c.branchId
        LEFT JOIN Payments p ON c.id = p.customerId AND p.status = 'completed'
      `;
      
      const params: Record<string, unknown> = {};
      
      if (startDate && endDate) {
        sql += ' AND p.createdAt >= @startDate AND p.createdAt <= @endDate';
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      sql += ' GROUP BY b.id, b.name ORDER BY b.name';
      
      const reports = await query<BranchReport>(sql, params);
      
      return NextResponse.json({ success: true, data: reports });
    } else if (type === 'employee-activity') {
      // Employee activity report - tracks work entries by employees
      let sql = `
        SELECT 
          CAST(w.createdAt AS DATE) as date,
          e.name as employeeName,
          e.id as employeeId,
          b.name as branchName,
          COUNT(*) as workCount,
          SUM(CASE WHEN w.status = 'completed' THEN 1 ELSE 0 END) as completedCount,
          SUM(CASE WHEN w.status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
          SUM(w.amount) as totalWorkValue
        FROM WorkEntries w
        LEFT JOIN Employees e ON w.employeeId = e.id
        LEFT JOIN Branches b ON w.branchId = b.id
        WHERE 1=1
      `;
      
      const params: Record<string, unknown> = {};
      
      if (branchId) {
        sql += ' AND w.branchId = @branchId';
        params.branchId = parseInt(branchId);
      }
      
      if (startDate && endDate) {
        sql += ' AND w.createdAt >= @startDate AND w.createdAt <= @endDate';
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      sql += ' GROUP BY CAST(w.createdAt AS DATE), e.id, e.name, b.name ORDER BY date DESC, e.name';
      
      const reports = await query(sql, params);
      
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
        totalPayments: number;
        totalWorks: number;
        totalCustomers: number;
        totalDocuments: number;
      }>(`
        SELECT 
          (SELECT ISNULL(SUM(amount), 0) FROM Payments WHERE status = 'completed' ${whereClause ? whereClause.replace('branchId', 'customerId IN (SELECT id FROM Customers WHERE branchId = @branchId)') : ''}) as totalRevenue,
          (SELECT COUNT(*) FROM Payments WHERE status = 'completed' ${whereClause ? whereClause.replace('branchId', 'customerId IN (SELECT id FROM Customers WHERE branchId = @branchId)') : ''}) as totalPayments,
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
