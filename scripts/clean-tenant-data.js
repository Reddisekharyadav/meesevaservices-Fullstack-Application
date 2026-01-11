const sql = require('mssql');

require('dotenv').config();

const config = {
  user: process.env.AZURE_SQL_USER || 'sevaadmin',
  password: process.env.AZURE_SQL_PASSWORD || 'SevaCenter@2026!',
  server: process.env.AZURE_SQL_SERVER || 'sevacentersql2026.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'sevacenterdb',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function cleanTenantData() {
  try {
    console.log('🔌 Connecting to database...');
    await sql.connect(config);
    
    // First, let's see what tenants exist
    console.log('📋 Checking existing businesses/tenants...');
    const businessResult = await sql.query`SELECT id, name, phone FROM Businesses`;
    console.log('Existing businesses:', businessResult.recordset);
    
    // Find the reference business (super admin 9999999999)
    let referenceBusinessId = null;
    for (const business of businessResult.recordset) {
      if (business.phone === '+91-9999999999' || business.phone === '9999999999') {
        referenceBusinessId = business.id;
        console.log(`✅ Found reference business: ${business.name} (ID: ${business.id})`);
        break;
      }
    }
    
    if (!referenceBusinessId) {
      console.log('⚠️ No reference business found with phone 9999999999. Creating one...');
      referenceBusinessId = 'business-reference';
      await sql.query`
        INSERT INTO Businesses (id, name, phone, email, website, address)
        VALUES (${referenceBusinessId}, 'Reference Business - Keep Data', '+91-9999999999', 'admin@reference.com', '', 'Reference Address')`;
      console.log(`✅ Created reference business with ID: ${referenceBusinessId}`);
    }
    
    console.log('🧹 Starting data cleanup...');
    
    // Update all existing data to belong to the reference business
    console.log('1. Updating WorkEntries...');
    const workResult = await sql.query`
      UPDATE WorkEntries 
      SET tenantId = ${referenceBusinessId}
      WHERE tenantId IS NULL OR tenantId IN ('business-1', 'business-2')`;
    console.log(`   Updated ${workResult.rowsAffected} work entries`);
    
    console.log('2. Updating Payments...');
    const paymentsResult = await sql.query`
      UPDATE Payments 
      SET tenantId = ${referenceBusinessId}
      WHERE tenantId IS NULL OR tenantId IN ('business-1', 'business-2')`;
    console.log(`   Updated ${paymentsResult.rowsAffected} payments`);
    
    console.log('3. Updating Documents...');
    const documentsResult = await sql.query`
      UPDATE Documents 
      SET tenantId = ${referenceBusinessId}
      WHERE tenantId IS NULL OR tenantId IN ('business-1', 'business-2')`;
    console.log(`   Updated ${documentsResult.rowsAffected} documents`);
    
    console.log('4. Updating Customers...');
    const customersResult = await sql.query`
      UPDATE Customers 
      SET tenantId = ${referenceBusinessId}
      WHERE tenantId IS NULL OR tenantId IN ('business-1', 'business-2')`;
    console.log(`   Updated ${customersResult.rowsAffected} customers`);
    
    console.log('5. Updating Employees...');
    const employeesResult = await sql.query`
      UPDATE Employees 
      SET tenantId = ${referenceBusinessId}
      WHERE tenantId IS NULL OR tenantId IN ('business-1', 'business-2')`;
    console.log(`   Updated ${employeesResult.rowsAffected} employees`);
    
    console.log('6. Updating Branches...');
    const branchesResult = await sql.query`
      UPDATE Branches 
      SET tenantId = ${referenceBusinessId}
      WHERE tenantId IS NULL OR tenantId IN ('business-1', 'business-2')`;
    console.log(`   Updated ${branchesResult.rowsAffected} branches`);
    
    console.log('✅ Data cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- All existing data assigned to reference business (ID: ${referenceBusinessId})`);
    console.log('- Reference super admin (9999999999) has access to all existing data');
    console.log('- New super admins will start with completely empty data');
    console.log('- Each business will be completely isolated');
    console.log('\n🎯 Next steps:');
    console.log('1. Test login with super admin 9999999999 - should see all existing data');
    console.log('2. Create a new super admin through /super-admin-setup');
    console.log('3. Login with new super admin - should see empty dashboard');
    console.log('4. Add fresh employees, branches, etc. for the new business');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sql.close();
    console.log('🔌 Database connection closed');
  }
}

cleanTenantData();