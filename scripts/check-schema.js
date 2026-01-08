const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function checkSchema() {
  try {
    console.log('Connecting to Azure SQL Database...');
    await sql.connect(config);
    console.log('Connected successfully!\n');

    // Get all tables
    const tablesResult = await sql.query`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;

    console.log('=== EXISTING TABLES ===');
    console.log(tablesResult.recordset.map(t => t.TABLE_NAME).join('\n'));
    console.log('\n');

    // Get columns for each table
    for (const table of tablesResult.recordset) {
      const tableName = table.TABLE_NAME;
      
      const columnsResult = await sql.query`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ${tableName}
        ORDER BY ORDINAL_POSITION
      `;

      console.log(`=== TABLE: ${tableName} ===`);
      columnsResult.recordset.forEach(col => {
        const type = col.CHARACTER_MAXIMUM_LENGTH 
          ? `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})`
          : col.DATA_TYPE;
        console.log(`  ${col.COLUMN_NAME}: ${type} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      console.log('');
    }

    // Check for super admins
    console.log('=== CHECKING ROLE VALUES AND CONSTRAINTS ===');
    const rolesResult = await sql.query`SELECT DISTINCT role FROM Employees`;
    console.log('Existing roles in database:', rolesResult.recordset);
    
    const constraintsResult = await sql.query`
      SELECT CONSTRAINT_NAME, CHECK_CLAUSE 
      FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
      WHERE TABLE_NAME = 'Employees'
    `;
    console.log('CHECK constraints on Employees table:', constraintsResult.recordset);

    console.log('=== CHECKING FOR SUPER ADMINS ===');
    const superAdminsResult = await sql.query`
      SELECT id, name, email, phone, role, branchId, isActive, createdAt
      FROM Employees
      WHERE role = 'superAdmin'
    `;
    console.log(`Found ${superAdminsResult.recordset.length} super admin(s):`);
    superAdminsResult.recordset.forEach(admin => {
      console.log(`  - ID: ${admin.id}, Name: ${admin.name}, Email: ${admin.email}, Phone: ${admin.phone}, Active: ${admin.isActive}`);
    });

    // Check all employees
    console.log('\n=== ALL EMPLOYEES ===');
    const allEmployeesResult = await sql.query`SELECT COUNT(*) as count FROM Employees`;
    console.log(`Total employees: ${allEmployeesResult.recordset[0].count}`);

    // Check all branches
    console.log('\n=== ALL BRANCHES ===');
    const branchesResult = await sql.query`SELECT COUNT(*) as count FROM Branches`;
    console.log(`Total branches: ${branchesResult.recordset[0].count}`);

    // Check all customers
    console.log('\n=== ALL CUSTOMERS ===');
    const customersResult = await sql.query`SELECT COUNT(*) as count FROM Customers`;
    console.log(`Total customers: ${customersResult.recordset[0].count}`);

  } catch (err) {
    console.error('Error:', err.message);
    console.error('Full error:', err);
  } finally {
    await sql.close();
  }
}

checkSchema();
