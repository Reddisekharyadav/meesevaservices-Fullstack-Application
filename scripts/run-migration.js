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

async function runMigration() {
  try {
    console.log('🔄 Connecting to Azure SQL Database...');
    await sql.connect(config);
    console.log('✅ Connected to database');

    // Check if employeeId column already exists
    const checkColumn = await sql.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'WorkEntries' AND COLUMN_NAME = 'employeeId'
    `);

    if (checkColumn.recordset.length > 0) {
      console.log('✅ employeeId column already exists in WorkEntries table');
    } else {
      console.log('🔄 Adding employeeId column to WorkEntries table...');
      
      // Add the employeeId column
      await sql.query(`
        ALTER TABLE WorkEntries 
        ADD employeeId INT NULL
      `);
      
      console.log('✅ Added employeeId column');
      
      // Add foreign key constraint
      await sql.query(`
        ALTER TABLE WorkEntries
        ADD CONSTRAINT FK_WorkEntries_Employee 
        FOREIGN KEY (employeeId) REFERENCES Employees(id)
      `);
      
      console.log('✅ Added foreign key constraint');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.close();
  }
}

runMigration();