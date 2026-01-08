# Seva Center - Multi-Branch Service Management System

A production-ready full-stack web application for managing a multi-branch local service business. Built with Next.js, TypeScript, Azure SQL Database, and Azure Blob Storage.

## 🚀 Features

- **Multi-Role System**: Super Admin, Branch Admin, Employee, Customer
- **Branch Management**: Create and manage multiple branches
- **Customer Management**: Track customers per branch with document uploads
- **Work Entry Tracking**: Create, assign, and track service work
- **Document Management**: Upload PDFs to Azure Blob Storage
- **Payment Recording**: Cash, UPI, and Razorpay test payments
- **Reports**: Daily and branch-wise performance reports
- **Responsive UI**: Mobile-friendly Tailwind CSS design

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (App Router)
- **Database**: Azure SQL Database
- **Storage**: Azure Blob Storage
- **Auth**: JWT with HTTP-only cookies
- **Payments**: Razorpay (Test Mode)

## 📋 Prerequisites

- Node.js 18+
- Azure Account (Student Pack or Free Tier)
- Razorpay Test Account (optional)

## 🔧 Azure Setup

### 1. Azure SQL Database

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **SQL Database** (Basic tier is free with Student Pack)
3. Configure firewall to allow your IP
4. Note down: Server name, Database name, Username, Password

### 2. Azure Blob Storage

1. Create a new **Storage Account**
2. Create a container named `documents`
3. Set container access level to **Private**
4. Note down: Account name, Access key, Container name

## 🚀 Local Development

### 1. Clone and Install

```bash
cd seva-center
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Azure SQL Database
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=seva-center
AZURE_SQL_USER=your-username
AZURE_SQL_PASSWORD=your-password

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_ACCOUNT_KEY=your-access-key
AZURE_STORAGE_CONTAINER_NAME=documents

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Razorpay (Test Mode - Optional)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### 3. Database Setup

Run the SQL schema in Azure SQL:

```sql
-- Execute database/schema.sql in Azure Query Editor
```

### 4. Seed Demo Data

```bash
npm run seed
```

This creates sample data with these login credentials:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@sevacenter.com | admin123 |
| Branch Admin | main.admin@sevacenter.com | branch123 |
| Employee | john@sevacenter.com | employee123 |
| Customer | rahul@example.com | customer123 |

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
seva-center/
├── database/
│   └── schema.sql          # SQL schema for Azure SQL
├── scripts/
│   └── seed.ts             # Database seeding script
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Login, logout, me
│   │   │   ├── branches/   # Branch CRUD
│   │   │   ├── customers/  # Customer CRUD
│   │   │   ├── documents/  # Document upload/download
│   │   │   ├── employees/  # Employee CRUD
│   │   │   ├── payments/   # Payment recording
│   │   │   ├── reports/    # Reports API
│   │   │   └── work-entries/  # Work entry CRUD
│   │   ├── admin/          # Super Admin dashboard
│   │   ├── branch/         # Branch Admin dashboard
│   │   ├── customer/       # Customer portal
│   │   ├── employee/       # Employee dashboard
│   │   └── login/          # Login pages
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utility libraries
│   │   ├── auth.ts        # JWT authentication
│   │   ├── blob.ts        # Azure Blob operations
│   │   ├── db.ts          # Database connection
│   │   ├── middleware.ts  # Role-based auth middleware
│   │   └── razorpay.ts    # Razorpay integration
│   └── types/
│       └── index.ts       # TypeScript interfaces
└── ...config files
```

## 🔐 Role Permissions

| Feature | Super Admin | Branch Admin | Employee | Customer |
|---------|:-----------:|:------------:|:--------:|:--------:|
| Manage All Branches | ✅ | ❌ | ❌ | ❌ |
| Manage Employees | ✅ | Own Branch | ❌ | ❌ |
| Manage Customers | ✅ | Own Branch | View | ❌ |
| Upload Documents | ✅ | ✅ | ✅ | ❌ |
| Download Documents | ✅ | ✅ | ✅ | Own |
| Record Payments | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | Own Branch | ❌ | ❌ |
| View Own Data | ✅ | ✅ | ✅ | ✅ |

## 🚀 Deployment to Azure

### Azure App Service

1. Build the application:
```bash
npm run build
```

2. Deploy using Azure CLI:
```bash
az webapp up --name seva-center-app --resource-group your-rg --plan your-plan
```

3. Configure environment variables in Azure Portal > App Service > Configuration

### Azure Static Web Apps (Alternative)

1. Push to GitHub
2. Create Static Web App in Azure Portal
3. Connect to your GitHub repo
4. Configure build settings:
   - App location: `/seva-center`
   - API location: `` (empty - using Next.js API routes)
   - Output location: `.next`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login (employee or customer)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Branches
- `GET /api/branches` - List branches
- `POST /api/branches` - Create branch
- `PUT /api/branches/[id]` - Update branch
- `DELETE /api/branches/[id]` - Delete branch

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Soft delete employee

### Customers
- `GET /api/customers` - List/search customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Soft delete customer

### Work Entries
- `GET /api/work-entries` - List work entries
- `POST /api/work-entries` - Create work entry
- `PUT /api/work-entries/[id]` - Update work entry
- `DELETE /api/work-entries/[id]` - Delete work entry

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document (PDF)
- `GET /api/documents/[id]` - Get download URL
- `DELETE /api/documents/[id]` - Delete document

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `POST /api/payments/razorpay` - Create Razorpay order

### Reports
- `GET /api/reports` - Get reports (daily, branch-wise)

## 🧪 Testing Razorpay

1. Use Razorpay Test credentials (rzp_test_xxx)
2. Test card: 4111 1111 1111 1111
3. Any future expiry, any CVV
4. OTP: 123456

## 📄 License

MIT License - feel free to use for your projects!

## 🤝 Support

For issues or questions, please open a GitHub issue.
