require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcrypt');

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

async function createReferenceAdmin() {
  try {
    console.log('🔌 Connecting to database...');
    await sql.connect(config);
    
    // Check if reference admin already exists
    const existingAdmin = await sql.query`
      SELECT id, name, phone FROM Employees 
      WHERE phone IN ('+91-9999999999', '9999999999')`;
    
    if (existingAdmin.recordset.length > 0) {
      console.log('✅ Reference admin already exists:', existingAdmin.recordset[0]);
      
      // Update the existing admin's tenant and password
      const passwordHash = await bcrypt.hash('admin123', 12);
      await sql.query`
        UPDATE Employees 
        SET tenantId = 'business-reference',
            passwordHash = ${passwordHash},
            name = 'Reference Super Admin - Keep All Data',
            email = 'admin@sevacentereference.com'
        WHERE phone IN ('+91-9999999999', '9999999999')`;
      
      console.log('✅ Updated existing reference admin with proper settings');
      console.log('\n🔑 Login Credentials:');
      console.log('   Phone: 9999999999');
      console.log('   Password: admin123');
      console.log('\n📝 This admin has access to all existing data and should be used only for reference/backup.');
      return;
    }
    
    // Create password hash for 'admin123'
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Create reference super admin
    console.log('👤 Creating reference super admin...');
    const result = await sql.query`
      INSERT INTO Employees (name, email, passwordHash, phone, role, tenantId, branchId, isActive)
      VALUES ('Reference Super Admin - Keep All Data', 'admin@sevacentereference.com', ${passwordHash}, '+91-9999999999', 'superAdmin', 'business-reference', NULL, 1)`;
    
    console.log('✅ Reference super admin created successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Phone: +91-9999999999 (or 9999999999)');
    console.log('   Password: admin123');
    console.log('\n📝 This admin has access to all existing data and should be used only for reference/backup.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.close();
  }
}

createReferenceAdmin();