-- =====================================================
-- Migration: Add employeeId to WorkEntries table
-- This adds tracking of which employee created each work entry
-- =====================================================

-- Add employeeId column to WorkEntries table
ALTER TABLE WorkEntries 
ADD employeeId INT NULL;

-- Add foreign key constraint
ALTER TABLE WorkEntries 
ADD CONSTRAINT FK_WorkEntries_Employee 
FOREIGN KEY (employeeId) REFERENCES Employees(id);

-- Create index for performance
CREATE INDEX IX_WorkEntries_EmployeeId ON WorkEntries(employeeId);

-- Optional: Update existing work entries to assign to a default employee
-- You can run this if you have existing data and want to assign it to someone
-- UPDATE WorkEntries SET employeeId = 1 WHERE employeeId IS NULL;

PRINT 'Migration completed: employeeId column added to WorkEntries table';