import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { Employee, Customer } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('seva_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    let userData = null;
    
    if (payload.userType === 'employee') {
      const employee = await queryOne<Employee>(
        `SELECT e.id, e.name, e.email, e.phone, e.role, e.branchId, b.name as branchName
         FROM Employees e
         LEFT JOIN Branches b ON e.branchId = b.id
         WHERE e.id = @id AND e.isActive = 1`,
        { id: payload.id }
      );
      
      if (employee) {
        userData = {
          ...employee,
          userType: 'employee',
        };
      }
    } else if (payload.userType === 'customer') {
      const customer = await queryOne<Customer>(
        `SELECT c.id, c.name, c.phone, c.email, c.branchId, b.name as branchName
         FROM Customers c
         LEFT JOIN Branches b ON c.branchId = b.id
         WHERE c.id = @id AND c.isActive = 1`,
        { id: payload.id }
      );
      
      if (customer) {
        userData = {
          ...customer,
          role: 'customer',
          userType: 'customer',
        };
      }
    }
    
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
