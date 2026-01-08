import sql from "mssql";
import bcrypt from "bcryptjs";

// Database configuration
const config: sql.config = {
  user: process.env.AZURE_SQL_USER!,
  password: process.env.AZURE_SQL_PASSWORD!,
  server: process.env.AZURE_SQL_SERVER!,
  database: process.env.AZURE_SQL_DATABASE!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const pool = await sql.connect(config);

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log("🗑️  Clearing existing data...");
    await pool.request().query("DELETE FROM Payments");
    await pool.request().query("DELETE FROM Documents");
    await pool.request().query("DELETE FROM WorkEntries");
    await pool.request().query("DELETE FROM Customers");
    await pool.request().query("DELETE FROM Employees");
    await pool.request().query("DELETE FROM Branches");
    console.log("✅ Existing data cleared\n");

    // Seed Branches
    console.log("🏢 Creating branches...");
    const branches = [
      { name: "Main Branch", code: "MAIN", address: "123 Main Street, City Center", phone: "9876543210" },
      { name: "North Branch", code: "NORTH", address: "456 North Avenue, Uptown", phone: "9876543211" },
      { name: "South Branch", code: "SOUTH", address: "789 South Road, Downtown", phone: "9876543212" },
    ];

    const branchIds: number[] = [];
    for (const branch of branches) {
      const result = await pool
        .request()
        .input("name", sql.NVarChar, branch.name)
        .input("code", sql.NVarChar, branch.code)
        .input("address", sql.NVarChar, branch.address)
        .input("phone", sql.NVarChar, branch.phone)
        .query(
          `INSERT INTO Branches (name, code, address, phone) 
           OUTPUT INSERTED.id 
           VALUES (@name, @code, @address, @phone)`
        );
      branchIds.push(result.recordset[0].id);
      console.log(`  ✅ Created branch: ${branch.name}`);
    }

    // Seed Employees
    console.log("\n👥 Creating employees...");
    const employees = [
      { name: "Super Admin", email: "admin@sevacenter.com", password: "admin123", phone: "9000000001", role: "superAdmin", branchId: branchIds[0] },
      { name: "Main Branch Admin", email: "main.admin@sevacenter.com", password: "branch123", phone: "9000000002", role: "branchAdmin", branchId: branchIds[0] },
      { name: "North Branch Admin", email: "north.admin@sevacenter.com", password: "branch123", phone: "9000000003", role: "branchAdmin", branchId: branchIds[1] },
      { name: "John Employee", email: "john@sevacenter.com", password: "employee123", phone: "9000000004", role: "employee", branchId: branchIds[0] },
      { name: "Jane Employee", email: "jane@sevacenter.com", password: "employee123", phone: "9000000005", role: "employee", branchId: branchIds[1] },
    ];

    const employeeIds: number[] = [];
    for (const emp of employees) {
      const hashedPassword = await hashPassword(emp.password);
      const result = await pool
        .request()
        .input("name", sql.NVarChar, emp.name)
        .input("email", sql.NVarChar, emp.email)
        .input("passwordHash", sql.NVarChar, hashedPassword)
        .input("phone", sql.NVarChar, emp.phone)
        .input("role", sql.NVarChar, emp.role)
        .input("branchId", sql.Int, emp.branchId)
        .query(
          `INSERT INTO Employees (name, email, passwordHash, phone, role, branchId) 
           OUTPUT INSERTED.id 
           VALUES (@name, @email, @passwordHash, @phone, @role, @branchId)`
        );
      employeeIds.push(result.recordset[0].id);
      console.log(`  ✅ Created employee: ${emp.name} (${emp.role})`);
    }

    // Seed Customers
    console.log("\n🧑 Creating customers...");
    const customers = [
      { name: "Rahul Kumar", phone: "8000000001", email: "rahul@example.com", password: "customer123", address: "100 Customer Street", branchId: branchIds[0] },
      { name: "Priya Sharma", phone: "8000000002", email: "priya@example.com", password: "customer123", address: "200 Customer Lane", branchId: branchIds[0] },
      { name: "Amit Singh", phone: "8000000003", email: "amit@example.com", password: "customer123", address: "300 Customer Road", branchId: branchIds[1] },
      { name: "Sneha Patel", phone: "8000000004", email: "sneha@example.com", password: "customer123", address: "400 Customer Avenue", branchId: branchIds[1] },
      { name: "Vikram Reddy", phone: "8000000005", email: "vikram@example.com", password: "customer123", address: "500 Customer Blvd", branchId: branchIds[2] },
    ];

    const customerIds: number[] = [];
    for (const cust of customers) {
      const hashedPassword = await hashPassword(cust.password);
      const result = await pool
        .request()
        .input("name", sql.NVarChar, cust.name)
        .input("phone", sql.NVarChar, cust.phone)
        .input("email", sql.NVarChar, cust.email)
        .input("passwordHash", sql.NVarChar, hashedPassword)
        .input("address", sql.NVarChar, cust.address)
        .input("branchId", sql.Int, cust.branchId)
        .query(
          `INSERT INTO Customers (name, phone, email, passwordHash, address, branchId) 
           OUTPUT INSERTED.id 
           VALUES (@name, @phone, @email, @passwordHash, @address, @branchId)`
        );
      customerIds.push(result.recordset[0].id);
      console.log(`  ✅ Created customer: ${cust.name}`);
    }

    // Seed Work Entries
    console.log("\n📝 Creating work entries...");
    const workEntries = [
      { customerId: customerIds[0], description: "Aadhar Card Update", amount: 200, status: "completed", branchId: branchIds[0] },
      { customerId: customerIds[0], description: "PAN Card Application", amount: 500, status: "in_progress", branchId: branchIds[0] },
      { customerId: customerIds[1], description: "Passport Renewal", amount: 1500, status: "pending", branchId: branchIds[0] },
      { customerId: customerIds[2], description: "Income Certificate", amount: 300, status: "completed", branchId: branchIds[1] },
      { customerId: customerIds[3], description: "Caste Certificate", amount: 250, status: "in_progress", branchId: branchIds[1] },
      { customerId: customerIds[4], description: "Birth Certificate", amount: 150, status: "pending", branchId: branchIds[2] },
    ];

    const workEntryIds: number[] = [];
    for (const work of workEntries) {
      const result = await pool
        .request()
        .input("customerId", sql.Int, work.customerId)
        .input("branchId", sql.Int, work.branchId)
        .input("description", sql.NVarChar, work.description)
        .input("amount", sql.Decimal, work.amount)
        .input("status", sql.NVarChar, work.status)
        .query(
          `INSERT INTO WorkEntries (customerId, branchId, description, amount, status) 
           OUTPUT INSERTED.id 
           VALUES (@customerId, @branchId, @description, @amount, @status)`
        );
      workEntryIds.push(result.recordset[0].id);
      console.log(`  ✅ Created work entry: ${work.description}`);
    }

    // Seed Payments
    console.log("\n💳 Creating payments...");
    const payments = [
      { customerId: customerIds[0], workEntryId: workEntryIds[0], amount: 200, mode: "cash", status: "completed" },
      { customerId: customerIds[2], workEntryId: workEntryIds[3], amount: 300, mode: "upi", status: "completed" },
      { customerId: customerIds[0], workEntryId: null, amount: 100, mode: "cash", status: "completed" },
    ];

    for (const pay of payments) {
      await pool
        .request()
        .input("customerId", sql.Int, pay.customerId)
        .input("workEntryId", sql.Int, pay.workEntryId)
        .input("amount", sql.Decimal, pay.amount)
        .input("mode", sql.NVarChar, pay.mode)
        .input("status", sql.NVarChar, pay.status)
        .query(
          `INSERT INTO Payments (customerId, workEntryId, amount, mode, status) 
           VALUES (@customerId, @workEntryId, @amount, @mode, @status)`
        );
      console.log(`  ✅ Created payment: ₹${pay.amount} (${pay.mode})`);
    }

    console.log("\n✅ Database seeding completed successfully!\n");
    console.log("📋 Login Credentials:");
    console.log("──────────────────────────────────────────");
    console.log("Super Admin:    admin@sevacenter.com / admin123");
    console.log("Branch Admin:   main.admin@sevacenter.com / branch123");
    console.log("Employee:       john@sevacenter.com / employee123");
    console.log("Customer:       rahul@example.com / customer123");
    console.log("──────────────────────────────────────────\n");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await pool.close();
  }
}

seed().catch(console.error);
