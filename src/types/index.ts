// Type definitions for Seva Center

export type Role = 'superAdmin' | 'branchAdmin' | 'employee';
export type CustomerRole = 'customer';
export type PaymentMode = 'cash' | 'upi' | 'test' | 'pending';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type WorkStatus = 'pending' | 'completed';

export interface Business {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: Role;
  branchId: number | null;
  branchName?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  password?: string;
  branchId: number;
  branchName?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkEntry {
  id: number;
  customerId: number;
  customerName?: string;
  branchId: number;
  branchName?: string;
  employeeId?: number;
  employeeName?: string;
  tenantId: string;
  description: string;
  amount: number;
  status: WorkStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Document {
  id: number;
  customerId: number;
  customerName?: string;
  originalName: string;
  blobName: string;
  fileSize: number | null;
  tenantId: string;
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
  tenantId: string;
  createdAt: Date;
}

// Auth types
export interface UserSession {
  id: number;
  name: string;
  phone: string;
  role: Role | CustomerRole;
  branchId: number | null;
  tenantId: string;
  userType: 'employee' | 'customer';
}

export interface JWTPayload {
  id: number;
  role: Role | CustomerRole;
  userType: 'employee' | 'customer';
  branchId: number | null;
  tenantId: string;
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
  paymentCount: number;
  workCount: number;
  customerCount: number;
}
