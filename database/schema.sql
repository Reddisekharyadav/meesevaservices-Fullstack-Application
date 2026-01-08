-- =====================================================
-- SEVA CENTER DATABASE SCHEMA
-- Azure SQL Database (Free Tier Compatible)
-- =====================================================

-- Create Branches Table
CREATE TABLE Branches (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    code NVARCHAR(20) NOT NULL,
    address NVARCHAR(500),
    phone NVARCHAR(15),
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Create Employees Table (includes all staff roles)
CREATE TABLE Employees (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    passwordHash NVARCHAR(255) NOT NULL,
    phone NVARCHAR(15),
    role NVARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'branch_admin', 'employee')),
    branchId INT NULL,
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (branchId) REFERENCES Branches(id)
);

-- Create Customers Table
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
CREATE TABLE WorkEntries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customerId INT NOT NULL,
    branchId INT NOT NULL,
    description NVARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (customerId) REFERENCES Customers(id),
    FOREIGN KEY (branchId) REFERENCES Branches(id)
);

-- Create Documents Table
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

-- Create indexes for common queries
CREATE INDEX IX_Employees_BranchId ON Employees(branchId);
CREATE INDEX IX_Employees_Email ON Employees(email);
CREATE INDEX IX_Customers_BranchId ON Customers(branchId);
CREATE INDEX IX_Customers_Phone ON Customers(phone);
CREATE INDEX IX_WorkEntries_CustomerId ON WorkEntries(customerId);
CREATE INDEX IX_WorkEntries_BranchId ON WorkEntries(branchId);
CREATE INDEX IX_WorkEntries_CreatedAt ON WorkEntries(createdAt);
CREATE INDEX IX_Documents_CustomerId ON Documents(customerId);
CREATE INDEX IX_Payments_CustomerId ON Payments(customerId);
CREATE INDEX IX_Payments_CreatedAt ON Payments(createdAt);
