import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import { Employee, Customer, UserSession } from '@/types';

// Extended types to include passwordHash from database
interface EmployeeRow extends Employee {
  passwordHash?: string;
}

interface CustomerRow extends Customer {
  passwordHash?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, phone, password, userType } = body;
    
    if (!password || !userType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    let user: UserSession | null = null;
    
    if (userType === 'employee') {
      // Employee login by phone
      if (!phone) {
        return NextResponse.json(
          { success: false, error: 'Phone number required for employee login' },
          { status: 400 }
        );
      }
      
      const employee = await queryOne<EmployeeRow>(
        'SELECT * FROM Employees WHERE phone = @phone AND isActive = 1',
        { phone }
      );
      
      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      const isValid = await verifyPassword(password, employee.passwordHash || '');
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      user = {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        branchId: employee.branchId,
        userType: 'employee',
      };
    } else if (userType === 'customer') {
      // Customer login by phone only
      if (!phone) {
        return NextResponse.json(
          { success: false, error: 'Phone number required for customer login' },
          { status: 400 }
        );
      }
      
      const customer = await queryOne<CustomerRow>(
        'SELECT * FROM Customers WHERE phone = @phone AND isActive = 1',
        { phone }
      );
      
      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      const isValid = await verifyPassword(password, customer.passwordHash || '');
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      user = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        role: 'customer',
        branchId: customer.branchId,
        userType: 'customer',
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid user type' },
        { status: 400 }
      );
    }
    
    // Create token and set cookie
    const token = await createToken(user);
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          branchId: user.branchId,
          userType: user.userType,
        },
        token,
      },
    });
    
    // Set cookie
    response.cookies.set('seva_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
