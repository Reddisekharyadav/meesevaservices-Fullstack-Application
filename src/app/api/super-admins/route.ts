import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';
import { Employee } from '@/types';

const HOST_KEY = process.env.SUPER_ADMIN_SETUP_KEY || '';

async function hasValidHostKey(req: NextRequest): Promise<boolean> {
  const provided = req.headers.get('x-setup-key');
  console.log('Setup Key Validation:', {
    hasEnvKey: Boolean(HOST_KEY),
    envKeyLength: HOST_KEY?.length,
    hasProvidedKey: Boolean(provided),
    providedKeyLength: provided?.length,
    keysMatch: provided === HOST_KEY,
  });
  return Boolean(HOST_KEY && provided && provided === HOST_KEY);
}

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  let token = req.cookies.get('seva_token')?.value || '';

  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return false;

  const payload = await verifyToken(token);
  return payload?.role === 'superAdmin';
}

async function ensureAccess(req: NextRequest, requireHostKey = false) {
  const hostOk = await hasValidHostKey(req);
  if (requireHostKey && !hostOk) return false;
  if (hostOk) return true;
  return isSuperAdmin(req);
}

export async function GET(req: NextRequest) {
  try {
    const authorized = await ensureAccess(req);
    if (!authorized) {
      console.log('GET /api/super-admins: Unauthorized');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Fetching super admins from database...');
    const superAdmins = await query<Employee>(
      `SELECT id, name, email, phone, role, branchId, isActive, createdAt, updatedAt
       FROM Employees
       WHERE role = 'superAdmin'
       ORDER BY createdAt DESC`
    );

    console.log(`Found ${superAdmins.length} super admins`);
    return NextResponse.json({
      success: true,
      data: {
        count: superAdmins.length,
        items: superAdmins,
      },
    });
  } catch (error) {
    console.error('Error fetching super admins:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch super admins' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorized = await ensureAccess(req, true);
    if (!authorized) {
      console.log('POST /api/super-admins: Unauthorized');
      return NextResponse.json(
        { success: false, error: 'Invalid host credential' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, phone, password, email } = body;

    console.log('Creating super admin:', { name, phone, email });

    if (!name || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, and password are required' },
        { status: 400 }
      );
    }

    // Use email as unique identifier, default to phone if not provided
    const adminEmail = email || `${phone}@sevacenter.local`;

    // Check if email already exists
    const existingEmail = await queryOne<Employee>(
      'SELECT id FROM Employees WHERE email = @email',
      { email: adminEmail }
    );

    if (existingEmail) {
      console.log('Email already exists:', adminEmail);
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await queryOne<Employee>(
      'SELECT id FROM Employees WHERE phone = @phone',
      { phone }
    );

    if (existingPhone) {
      console.log('Phone already exists:', phone);
      return NextResponse.json(
        { success: false, error: 'Phone number already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const result = await execute(
      `INSERT INTO Employees (name, email, passwordHash, phone, role, branchId, isActive)
       OUTPUT INSERTED.id
       VALUES (@name, @email, @passwordHash, @phone, 'superAdmin', NULL, 1)`,
      {
        name,
        email: adminEmail,
        passwordHash: hashedPassword,
        phone,
      }
    );

    const insertedId = (result.recordset as { id: number }[])[0]?.id;

    console.log('Super admin created successfully with ID:', insertedId);
    return NextResponse.json({
      success: true,
      data: { id: insertedId, name, phone, email: adminEmail, role: 'superAdmin' },
      message: 'Super admin created successfully',
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, error: 'Failed to create super admin' },
      { status: 500 }
    );
  }
}
