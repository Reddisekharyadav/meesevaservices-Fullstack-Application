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

async function seedMinimal() {
  console.log('🌱 Starting minimal database setup...\n');
  
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to database\n');

    // Hash password for super admin
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Clear ALL existing data (in reverse order due to FK constraints)
    console.log('🗑️  Clearing all existing data...');
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

    // Insert ONLY ONE Super Admin
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

    console.log('\n✅ Database setup completed successfully!\n');
    console.log('='.repeat(60));
    console.log('LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('\n🔴 SUPER ADMIN:');
    console.log('   Email: admin@sevacenter.com');
    console.log('   Phone: 9999999999');
    console.log('   Password: admin123');
    console.log('\n📝 NOTE: Add branches, employees, and customers through the web interface.');
    console.log('\n' + '='.repeat(60));

    await pool.close();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

seedMinimal();
