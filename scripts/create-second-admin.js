const sql = require('mssql');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const config = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function createSecondSuperAdmin() {
  try {
    console.log('🔄 Connecting to Azure SQL Database...');
    await sql.connect(config);
    console.log('✅ Connected to database');

    // Check if second super admin already exists
    const existingAdmin = await sql.query(`
      SELECT id FROM Employees 
      WHERE tenantId = 'business-2' AND role = 'superAdmin'
    `);

    if (existingAdmin.recordset.length > 0) {
      console.log('✅ Second super admin already exists');
      console.log('\n📊 Current Super Admins:');
      
      const allAdmins = await sql.query(`
        SELECT e.id, e.name, e.phone, e.email, e.tenantId, b.name as businessName
        FROM Employees e
        LEFT JOIN Businesses b ON e.tenantId = b.id
        WHERE e.role = 'superAdmin'
        ORDER BY e.tenantId
      `);
      
      allAdmins.recordset.forEach(admin => {
        console.log(`  - ${admin.name} (${admin.phone}) - Business: ${admin.businessName}`);
      });
      
      return;
    }

    // Hash password for second admin
    const password = 'SevaAdmin@2026!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create second super admin
    console.log('🔄 Creating second super admin...');
    const result = await sql.query(`
      INSERT INTO Employees (name, email, phone, passwordHash, role, tenantId, isActive)
      OUTPUT INSERTED.id
      VALUES ('Super Admin 2', 'admin2@business2.com', '+91-9876543212', '${hashedPassword}', 'superAdmin', 'business-2', 1)
    `);

    const adminId = result.recordset[0].id;
    console.log(`✅ Created second super admin with ID: ${adminId}`);

    // Create 3 branches for second business
    console.log('🔄 Creating branches for second business...');
    
    const branches = [
      { name: 'Business 2 - Main Branch', code: 'B2-MAIN', address: '456 Business St, City' },
      { name: 'Business 2 - North Branch', code: 'B2-NORTH', address: '789 North Ave, City' },
      { name: 'Business 2 - South Branch', code: 'B2-SOUTH', address: '321 South Rd, City' }
    ];

    for (const branch of branches) {
      await sql.query(`
        INSERT INTO Branches (name, code, address, phone, tenantId, isActive)
        VALUES ('${branch.name}', '${branch.code}', '${branch.address}', '+91-9876543212', 'business-2', 1)
      `);
      console.log(`✅ Created branch: ${branch.name}`);
    }

    // Update business 2 information
    console.log('🔄 Updating business 2 information...');
    await sql.query(`
      UPDATE Businesses 
      SET name = 'Seva Center Business 2',
          phone = '+91-9876543212',
          email = 'admin@business2.com',
          address = '456 Business Street, City, State 12345'
      WHERE id = 'business-2'
    `);

    console.log('\n🎉 Second business setup completed successfully!');
    console.log('\n📋 Business 2 Details:');
    console.log('  - Super Admin: Super Admin 2');
    console.log('  - Phone: +91-9876543212');
    console.log('  - Email: admin2@business2.com');
    console.log('  - Password: SevaAdmin@2026!');
    console.log('  - Tenant ID: business-2');
    console.log('  - Branches: 3 (Main, North, South)');
    
    // Show login instructions
    console.log('\n🔑 Login Instructions:');
    console.log('  1. Go to login page');
    console.log('  2. Select "Employee Login"');
    console.log('  3. Phone: +91-9876543212');
    console.log('  4. Password: SevaAdmin@2026!');
    console.log('  5. Each super admin will only see their own business data');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await sql.close();
  }
}

createSecondSuperAdmin();