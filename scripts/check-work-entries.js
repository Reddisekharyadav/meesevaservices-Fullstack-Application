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

async function checkWorkEntries() {
  try {
    console.log('🔄 Connecting to Azure SQL Database...');
    await sql.connect(config);
    console.log('✅ Connected to database');

    // Check work entries without employeeId
    const nullEmployeeEntries = await sql.query(`
      SELECT id, description, createdAt, branchId
      FROM WorkEntries 
      WHERE employeeId IS NULL
      ORDER BY createdAt DESC
    `);

    console.log(`📋 Found ${nullEmployeeEntries.recordset.length} work entries without employeeId:`);
    
    nullEmployeeEntries.recordset.forEach((entry, index) => {
      console.log(`${index + 1}. ID: ${entry.id}, Description: "${entry.description}", Branch: ${entry.branchId}, Created: ${entry.createdAt}`);
    });

    // Check all work entries
    const allEntries = await sql.query(`
      SELECT id, description, employeeId, createdAt
      FROM WorkEntries 
      ORDER BY createdAt DESC
    `);

    console.log(`\n📊 Total work entries: ${allEntries.recordset.length}`);
    
    // Get super admin ID for default assignment
    const superAdmin = await sql.query(`
      SELECT TOP 1 id, name, email
      FROM Employees 
      WHERE role = 'superAdmin'
      ORDER BY id ASC
    `);

    if (superAdmin.recordset.length > 0) {
      const adminId = superAdmin.recordset[0].id;
      console.log(`\n👑 Super Admin found: ID ${adminId}, Name: ${superAdmin.recordset[0].name}`);
      
      if (nullEmployeeEntries.recordset.length > 0) {
        console.log(`\n🔄 Assigning null employeeId entries to super admin...`);
        
        const updateResult = await sql.query(`
          UPDATE WorkEntries 
          SET employeeId = ${adminId}
          WHERE employeeId IS NULL
        `);
        
        console.log(`✅ Updated ${updateResult.rowsAffected[0]} work entries`);
      }
    } else {
      console.log('\n❌ No super admin found in the system');
    }

    console.log('\n🎉 Check completed successfully!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await sql.close();
  }
}

checkWorkEntries();