require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.AZURE_SQL_USER || 'sevaadmin',
  password: process.env.AZURE_SQL_PASSWORD || 'SevaCenter@2026!',
  server: process.env.AZURE_SQL_SERVER || 'sevacentersql2026.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'sevacenterdb',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function checkRoleConstraint() {
  try {
    await sql.connect(config);
    
    console.log('Checking existing employees...');
    const employees = await sql.query`SELECT name, phone, role FROM Employees`;
    console.log('Existing employees:', employees.recordset);
    
    console.log('\nChecking role constraint...');
    const constraint = await sql.query`
      SELECT cc.CONSTRAINT_NAME, cc.CHECK_CLAUSE 
      FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc 
      JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cu ON cc.CONSTRAINT_NAME = cu.CONSTRAINT_NAME 
      WHERE cu.TABLE_NAME = 'Employees' AND cu.COLUMN_NAME = 'role'`;
    console.log('Role constraints:', constraint.recordset);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.close();
  }
}

checkRoleConstraint();