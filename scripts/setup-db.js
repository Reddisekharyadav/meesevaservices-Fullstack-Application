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

const schema = `
-- Create Branches Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Branches')
CREATE TABLE Branches (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    code NVARCHAR(20) NOT NULL UNIQUE,
    address NVARCHAR(500),
    phone NVARCHAR(15),
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Create Employees Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Employees')
CREATE TABLE Employees (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    passwordHash NVARCHAR(255) NOT NULL,
    phone NVARCHAR(15),
    role NVARCHAR(20) NOT NULL CHECK (role IN ('superAdmin', 'branchAdmin', 'employee')),
    branchId INT NULL,
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (branchId) REFERENCES Branches(id)
);

-- Create Customers Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
CREATE TABLE Customers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(15) NOT NULL,
    email NVARCHAR(100),
    passwordHash NVARCHAR(255) NOT NULL,
    address NVARCHAR(500),
    branchId INT NOT NULL,
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (branchId) REFERENCES Branches(id)
);

-- Create WorkEntries Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkEntries')
CREATE TABLE WorkEntries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customerId INT NOT NULL,
    branchId INT NOT NULL,
    description NVARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (customerId) REFERENCES Customers(id),
    FOREIGN KEY (branchId) REFERENCES Branches(id)
);

-- Create Documents Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Documents')
CREATE TABLE Documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customerId INT NOT NULL,
    originalName NVARCHAR(255) NOT NULL,
    blobName NVARCHAR(500) NOT NULL,
    description NVARCHAR(500),
    fileSize INT,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (customerId) REFERENCES Customers(id)
);

-- Create Payments Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Payments')
CREATE TABLE Payments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customerId INT NOT NULL,
    workEntryId INT,
    amount DECIMAL(10,2) NOT NULL,
    mode NVARCHAR(20) NOT NULL CHECK (mode IN ('cash', 'upi', 'test')),
    status NVARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    razorpayOrderId NVARCHAR(100),
    razorpayPaymentId NVARCHAR(100),
    notes NVARCHAR(500),
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (customerId) REFERENCES Customers(id),
    FOREIGN KEY (workEntryId) REFERENCES WorkEntries(id)
);
`;

async function setupDatabase() {
  console.log('🔧 Setting up database...\n');
  console.log('Server:', config.server);
  console.log('Database:', config.database);
  console.log('User:', config.user);
  
  try {
    const pool = await sql.connect(config);
    console.log('\n✅ Connected to Azure SQL Database\n');

    // Split and run each statement
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.request().query(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log('⏭️  Skipped (exists):', statement.substring(0, 50) + '...');
          } else {
            console.log('❌ Error:', err.message);
          }
        }
      }
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IX_Employees_BranchId ON Employees(branchId)',
      'CREATE INDEX IX_Customers_BranchId ON Customers(branchId)',
      'CREATE INDEX IX_Customers_Phone ON Customers(phone)',
      'CREATE INDEX IX_WorkEntries_CustomerId ON WorkEntries(customerId)',
      'CREATE INDEX IX_Documents_CustomerId ON Documents(customerId)',
      'CREATE INDEX IX_Payments_CustomerId ON Payments(customerId)',
    ];

    for (const idx of indexes) {
      try {
        await pool.request().query(idx);
        console.log('✅ Created index');
      } catch (err) {
        // Index likely exists
      }
    }

    console.log('\n✅ Database setup completed!\n');
    await pool.close();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
