// Type definitions for Seva Center

export type Role = 'super_admin' | 'branch_admin' | 'employee';
export type CustomerRole = 'customer';
export type PaymentMode = 'cash' | 'upi' | 'test' | 'pending';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type WorkStatus = 'pending' | 'completed';

export interface Branch {
  id: number;
  name: string;
  city: string;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: number;
  name: string;
  phone: string;
  password?: string;
  role: Role;
  branchId: number | null;
  branchName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  username: string;
  password?: string;
  branchId: number;
  branchName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkEntry {
  id: number;
  customerId: number;
  customerName?: string;
  employeeId: number;
  employeeName?: string;
  branchId: number;
  branchName?: string;
  description: string;
  amount: number;
  paymentMode: PaymentMode;
  status: WorkStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: number;
  customerId: number;
  customerName?: string;
  fileName: string;
  blobUrl: string;
  uploadedBy: number;
  uploadedByName?: string;
  fileSize: number | null;
  createdAt: Date;
}

export interface Payment {
  id: number;
  customerId: number;
  customerName?: string;
  workEntryId: number | null;
  amount: number;
  mode: PaymentMode;
  status: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  notes: string | null;
  createdAt: Date;
}

// Auth types
export interface UserSession {
  id: number;
  name: string;
  phone: string;
  role: Role | CustomerRole;
  branchId: number | null;
  userType: 'employee' | 'customer';
}

export interface JWTPayload {
  id: number;
  role: Role | CustomerRole;
  userType: 'employee' | 'customer';
  branchId: number | null;
  iat: number;
  exp: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Report types
export interface DailyReport {
  date: string;
  totalAmount: number;
  cashAmount: number;
  upiAmount: number;
  testAmount: number;
  workCount: number;
}

export interface BranchReport {
  branchId: number;
  branchName: string;
  totalAmount: number;
  workCount: number;
  customerCount: number;
}
