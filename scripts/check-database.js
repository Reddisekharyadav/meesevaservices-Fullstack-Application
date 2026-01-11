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

async function checkTables() {
  try {
    console.log('🔌 Connecting to database...');
    await sql.connect(config);
    
    console.log('📋 Checking all tables...');
    const tablesResult = await sql.query`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      ORDER BY TABLE_NAME, ORDINAL_POSITION`;
    
    const tables = {};
    tablesResult.recordset.forEach(row => {
      if (!tables[row.TABLE_NAME]) {
        tables[row.TABLE_NAME] = [];
      }
      tables[row.TABLE_NAME].push(`${row.COLUMN_NAME} (${row.DATA_TYPE})`);
    });
    
    Object.keys(tables).forEach(table => {
      console.log(`\n${table}:`);
      tables[table].forEach(column => console.log(`  - ${column}`));
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.close();
  }
}

checkTables();