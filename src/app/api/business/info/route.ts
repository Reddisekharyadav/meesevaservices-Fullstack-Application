import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withEmployeeAuth, AuthenticatedRequest } from '@/lib/middleware';
import { Business } from '@/types';

// GET business info for current tenant
export const GET = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  try {
    const tenantId = req.user.tenantId;
    
    const business = await query<Business>(
      'SELECT id, name, logo, website, address, phone, email, isActive, createdAt FROM Businesses WHERE id = @tenantId',
      { tenantId }
    );

    if (business.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: business[0],
    });
  } catch (error) {
    console.error('Error fetching business info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business info' },
      { status: 500 }
    );
  }
});

// PUT update business info
export const PUT = withEmployeeAuth(async (req: AuthenticatedRequest) => {
  try {
    // Only super admins can update business info
    if (req.user.role !== 'superAdmin') {
      return NextResponse.json(
        { success: false, error: 'Only super admins can update business information' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, logo, website, address, phone, email } = body;
    const tenantId = req.user.tenantId;

    await query(
      `UPDATE Businesses 
       SET name = @name, logo = @logo, website = @website, 
           address = @address, phone = @phone, email = @email
       WHERE id = @tenantId`,
      { name, logo, website, address, phone, email, tenantId }
    );

    return NextResponse.json({
      success: true,
      message: 'Business information updated successfully',
    });
  } catch (error) {
    console.error('Error updating business info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update business info' },
      { status: 500 }
    );
  }
});