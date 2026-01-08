import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthCookie } from '@/lib/auth';
import { JWTPayload, Role, CustomerRole } from '@/types';

export type AuthenticatedRequest = NextRequest & {
  user: JWTPayload;
};

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  allowedRoles?: (Role | CustomerRole)[]
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Get token from cookie or Authorization header
    let token = req.cookies.get('seva_token')?.value;
    
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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
    
    // Check role if specified
    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Add user to request
    (req as AuthenticatedRequest).user = payload;
    
    return handler(req as AuthenticatedRequest);
  };
}

export function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, ['superAdmin', 'branchAdmin']);
}

export function withSuperAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, ['superAdmin']);
}

export function withEmployeeAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, ['superAdmin', 'branchAdmin', 'employee']);
}

export function withCustomerAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, ['customer']);
}
