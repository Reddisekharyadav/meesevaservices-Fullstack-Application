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

async function seed() {
  console.log('🌱 Starting database seed...\n');
  
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to database\n');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const branchPassword = await bcrypt.hash('branch123', 10);
    const employeePassword = await bcrypt.hash('employee123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    // Clear existing data (in reverse order due to FK constraints)
    console.log('🗑️  Clearing existing data...');
    await pool.request().query('DELETE FROM Payments');
    await pool.request().query('DELETE FROM Documents');
    await pool.request().query('DELETE FROM WorkEntries');
    await pool.request().query('DELETE FROM Customers');
    await pool.request().query('DELETE FROM Employees');
    await pool.request().query('DELETE FROM Branches');
    
    // Reset identity seeds
    await pool.request().query("DBCC CHECKIDENT ('Branches', RESEED, 0)");
    await pool.request().query("DBCC CHECKIDENT ('Employees', RESEED, 0)");
    await pool.request().query("DBCC CHECKIDENT ('Customers', RESEED, 0)");
    await pool.request().query("DBCC CHECKIDENT ('WorkEntries', RESEED, 0)");
    await pool.request().query("DBCC CHECKIDENT ('Documents', RESEED, 0)");
    await pool.request().query("DBCC CHECKIDENT ('Payments', RESEED, 0)");

    // Insert Branches
    console.log('📍 Creating branches...');
    await pool.request().query(`
      INSERT INTO Branches (name, code, address, phone, isActive) VALUES
      ('Main Branch', 'MAIN001', '123 Main Street, City Center', '9876543210', 1),
      ('North Branch', 'NORTH001', '456 North Road, North Zone', '9876543211', 1),
      ('South Branch', 'SOUTH001', '789 South Avenue, South Zone', '9876543212', 1)
    `);

    // Insert Super Admin
    console.log('👤 Creating super admin...');
    await pool.request()
      .input('name', sql.NVarChar, 'Super Admin')
      .input('email', sql.NVarChar, 'admin@sevacenter.com')
      .input('passwordHash', sql.NVarChar, adminPassword)
      .input('phone', sql.NVarChar, '9999999999')
      .input('role', sql.NVarChar, 'superAdmin')
      .query(`
        INSERT INTO Employees (name, email, passwordHash, phone, role, branchId, isActive)
        VALUES (@name, @email, @passwordHash, @phone, @role, NULL, 1)
      `);

    // Insert Branch Admins
    console.log('👤 Creating branch admins...');
    await pool.request()
      .input('name', sql.NVarChar, 'Main Branch Admin')
      .input('email', sql.NVarChar, 'main.admin@sevacenter.com')
      .input('passwordHash', sql.NVarChar, branchPassword)
      .input('phone', sql.NVarChar, '9888888881')
      .input('role', sql.NVarChar, 'branchAdmin')
      .input('branchId', sql.Int, 1)
      .query(`
        INSERT INTO Employees (name, email, passwordHash, phone, role, branchId, isActive)
        VALUES (@name, @email, @passwordHash, @phone, @role, @branchId, 1)
      `);

    await pool.request()
      .input('name', sql.NVarChar, 'North Branch Admin')
      .input('email', sql.NVarChar, 'north.admin@sevacenter.com')
      .input('passwordHash', sql.NVarChar, branchPassword)
      .input('phone', sql.NVarChar, '9888888882')
      .input('role', sql.NVarChar, 'branchAdmin')
      .input('branchId', sql.Int, 2)
      .query(`
        INSERT INTO Employees (name, email, passwordHash, phone, role, branchId, isActive)
        VALUES (@name, @email, @passwordHash, @phone, @role, @branchId, 1)
      `);

    // Insert Employees
    console.log('👤 Creating employees...');
    await pool.request()
      .input('name', sql.NVarChar, 'Ramesh Kumar')
      .input('email', sql.NVarChar, 'ramesh@sevacenter.com')
      .input('passwordHash', sql.NVarChar, employeePassword)
      .input('phone', sql.NVarChar, '9777777771')
      .input('role', sql.NVarChar, 'employee')
      .input('branchId', sql.Int, 1)
      .query(`
        INSERT INTO Employees (name, email, passwordHash, phone, role, branchId, isActive)
        VALUES (@name, @email, @passwordHash, @phone, @role, @branchId, 1)
      `);

    await pool.request()
      .input('name', sql.NVarChar, 'Suresh Babu')
      .input('email', sql.NVarChar, 'suresh@sevacenter.com')
      .input('passwordHash', sql.NVarChar, employeePassword)
      .input('phone', sql.NVarChar, '9777777772')
      .input('role', sql.NVarChar, 'employee')
      .input('branchId', sql.Int, 2)
      .query(`
        INSERT INTO Employees (name, email, passwordHash, phone, role, branchId, isActive)
        VALUES (@name, @email, @passwordHash, @phone, @role, @branchId, 1)
      `);

    // Insert Customers
    console.log('👥 Creating customers...');
    await pool.request()
      .input('name', sql.NVarChar, 'Venkat Rao')
      .input('phone', sql.NVarChar, '9666666661')
      .input('email', sql.NVarChar, 'venkat@example.com')
      .input('passwordHash', sql.NVarChar, customerPassword)
      .input('address', sql.NVarChar, '101 Customer Lane, City')
      .input('branchId', sql.Int, 1)
      .query(`
        INSERT INTO Customers (name, phone, email, passwordHash, address, branchId, isActive)
        VALUES (@name, @phone, @email, @passwordHash, @address, @branchId, 1)
      `);

    await pool.request()
      .input('name', sql.NVarChar, 'Lakshmi Devi')
      .input('phone', sql.NVarChar, '9666666662')
      .input('email', sql.NVarChar, 'lakshmi@example.com')
      .input('passwordHash', sql.NVarChar, customerPassword)
      .input('address', sql.NVarChar, '202 Customer Street, Town')
      .input('branchId', sql.Int, 1)
      .query(`
        INSERT INTO Customers (name, phone, email, passwordHash, address, branchId, isActive)
        VALUES (@name, @phone, @email, @passwordHash, @address, @branchId, 1)
      `);

    await pool.request()
      .input('name', sql.NVarChar, 'Ravi Shankar')
      .input('phone', sql.NVarChar, '9666666663')
      .input('email', sql.NVarChar, 'ravi@example.com')
      .input('passwordHash', sql.NVarChar, customerPassword)
      .input('address', sql.NVarChar, '303 Customer Road, Village')
      .input('branchId', sql.Int, 2)
      .query(`
        INSERT INTO Customers (name, phone, email, passwordHash, address, branchId, isActive)
        VALUES (@name, @phone, @email, @passwordHash, @address, @branchId, 1)
      `);

    // Get actual customer IDs
    console.log('📝 Creating work entries...');
    const customersResult = await pool.request().query('SELECT id FROM Customers ORDER BY id');
    const customerIds = customersResult.recordset.map(r => r.id);
    
    const branchesResult = await pool.request().query('SELECT id FROM Branches ORDER BY id');
    const branchIds = branchesResult.recordset.map(r => r.id);
    
    console.log('Customer IDs:', customerIds);
    console.log('Branch IDs:', branchIds);

    await pool.request()
      .input('customerId', sql.Int, customerIds[0])
      .input('branchId', sql.Int, branchIds[0])
      .input('description', sql.NVarChar, 'Aadhar Card Update - Address Change')
      .input('amount', sql.Decimal(10, 2), 100.00)
      .input('status', sql.NVarChar, 'completed')
      .query(`
        INSERT INTO WorkEntries (customerId, branchId, description, amount, status)
        VALUES (@customerId, @branchId, @description, @amount, @status)
      `);

    await pool.request()
      .input('customerId', sql.Int, customerIds[0])
      .input('branchId', sql.Int, branchIds[0])
      .input('description', sql.NVarChar, 'PAN Card Application')
      .input('amount', sql.Decimal(10, 2), 250.00)
      .input('status', sql.NVarChar, 'in_progress')
      .query(`
        INSERT INTO WorkEntries (customerId, branchId, description, amount, status)
        VALUES (@customerId, @branchId, @description, @amount, @status)
      `);

    await pool.request()
      .input('customerId', sql.Int, customerIds[1])
      .input('branchId', sql.Int, branchIds[0])
      .input('description', sql.NVarChar, 'Passport Renewal')
      .input('amount', sql.Decimal(10, 2), 500.00)
      .input('status', sql.NVarChar, 'pending')
      .query(`
        INSERT INTO WorkEntries (customerId, branchId, description, amount, status)
        VALUES (@customerId, @branchId, @description, @amount, @status)
      `);

    await pool.request()
      .input('customerId', sql.Int, customerIds[2])
      .input('branchId', sql.Int, branchIds[1])
      .input('description', sql.NVarChar, 'Driving License Renewal')
      .input('amount', sql.Decimal(10, 2), 300.00)
      .input('status', sql.NVarChar, 'pending')
      .query(`
        INSERT INTO WorkEntries (customerId, branchId, description, amount, status)
        VALUES (@customerId, @branchId, @description, @amount, @status)
      `);

    // Get work entry IDs
    const workResult = await pool.request().query('SELECT id FROM WorkEntries ORDER BY id');
    const workIds = workResult.recordset.map(r => r.id);
    console.log('Work Entry IDs:', workIds);

    // Insert Payments
    console.log('💰 Creating payment records...');
    await pool.request()
      .input('customerId', sql.Int, customerIds[0])
      .input('workEntryId', sql.Int, workIds[0])
      .input('amount', sql.Decimal(10, 2), 100.00)
      .input('mode', sql.NVarChar, 'cash')
      .input('status', sql.NVarChar, 'completed')
      .input('notes', sql.NVarChar, 'Payment for Aadhar update')
      .query(`
        INSERT INTO Payments (customerId, workEntryId, amount, mode, status, notes)
        VALUES (@customerId, @workEntryId, @amount, @mode, @status, @notes)
      `);

    await pool.request()
      .input('customerId', sql.Int, customerIds[0])
      .input('workEntryId', sql.Int, workIds[1])
      .input('amount', sql.Decimal(10, 2), 125.00)
      .input('mode', sql.NVarChar, 'upi')
      .input('status', sql.NVarChar, 'completed')
      .input('notes', sql.NVarChar, 'Advance for PAN card')
      .query(`
        INSERT INTO Payments (customerId, workEntryId, amount, mode, status, notes)
        VALUES (@customerId, @workEntryId, @amount, @mode, @status, @notes)
      `);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('='.repeat(50));
    console.log('Demo Login Credentials:');
    console.log('='.repeat(50));
    console.log('\n🔴 SUPER ADMIN:');
    console.log('   Email: admin@sevacenter.com');
    console.log('   Password: admin123');
    console.log('\n🟠 BRANCH ADMIN:');
    console.log('   Email: main.admin@sevacenter.com');
    console.log('   Password: branch123');
    console.log('\n🟢 EMPLOYEE:');
    console.log('   Email: ramesh@sevacenter.com');
    console.log('   Password: employee123');
    console.log('\n🔵 CUSTOMER (Phone Login):');
    console.log('   Phone: 9666666661');
    console.log('   Password: customer123');
    console.log('\n' + '='.repeat(50));

    await pool.close();
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
