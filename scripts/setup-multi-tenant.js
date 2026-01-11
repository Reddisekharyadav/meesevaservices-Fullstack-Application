const sql = require('mssql');
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

async function addTenantSupport() {
  try {
    console.log('🔄 Connecting to Azure SQL Database...');
    await sql.connect(config);
    console.log('✅ Connected to database');

    // Add tenantId to all relevant tables
    const tables = [
      'Branches', 
      'Employees', 
      'Customers', 
      'WorkEntries', 
      'Payments', 
      'Documents'
    ];

    for (const table of tables) {
      // Check if tenantId column exists
      const columnExists = await sql.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = 'tenantId'
      `);

      if (columnExists.recordset.length === 0) {
        console.log(`🔄 Adding tenantId to ${table} table...`);
        
        // Add tenantId column
        await sql.query(`ALTER TABLE ${table} ADD tenantId NVARCHAR(50) NULL`);
        console.log(`✅ Added tenantId to ${table}`);

        // Update existing records to have tenantId of first super admin
        const updateResult = await sql.query(`
          UPDATE ${table} SET tenantId = 'business-1' WHERE tenantId IS NULL
        `);
        console.log(`✅ Updated ${updateResult.rowsAffected[0]} records in ${table}`);
      } else {
        console.log(`✅ tenantId already exists in ${table}`);
      }
    }

    // Add business info table for tenant management
    const businessTableExists = await sql.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Businesses'
    `);

    if (businessTableExists.recordset.length === 0) {
      console.log('🔄 Creating Businesses table...');
      await sql.query(`
        CREATE TABLE Businesses (
          id NVARCHAR(50) PRIMARY KEY,
          name NVARCHAR(100) NOT NULL,
          logo NVARCHAR(500),
          website NVARCHAR(200),
          address NVARCHAR(500),
          phone NVARCHAR(15),
          email NVARCHAR(100),
          isActive BIT DEFAULT 1,
          createdAt DATETIME2 DEFAULT GETUTCDATE()
        )
      `);

      // Insert default businesses
      await sql.query(`
        INSERT INTO Businesses (id, name, website, phone, email) VALUES
        ('business-1', 'Seva Center Business 1', 'https://business1.com', '+91-9876543210', 'admin@business1.com'),
        ('business-2', 'Seva Center Business 2', 'https://business2.com', '+91-9876543211', 'admin@business2.com')
      `);

      console.log('✅ Created Businesses table with default data');
    }

    // Update Employees table to add tenantId reference
    const employeeTenantConstraint = await sql.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_NAME = 'Employees' 
      AND CONSTRAINT_NAME = 'FK_Employees_Business'
    `);

    if (employeeTenantConstraint.recordset.length === 0) {
      await sql.query(`
        ALTER TABLE Employees
        ADD CONSTRAINT FK_Employees_Business 
        FOREIGN KEY (tenantId) REFERENCES Businesses(id)
      `);
      console.log('✅ Added foreign key constraint for Employees tenantId');
    }

    console.log('\n🎉 Multi-tenant setup completed successfully!');
    console.log('📋 Summary:');
    console.log('  - Added tenantId to all data tables');
    console.log('  - Created Businesses table');
    console.log('  - Set up foreign key relationships');
    console.log('  - Assigned existing data to business-1');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.close();
  }
}

addTenantSupport();