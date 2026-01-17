import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
    }
    
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

export interface CreateOrderParams {
  amount: number; // Amount in rupees
  customerId: number;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export async function createOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
  const razorpay = getRazorpayInstance();
  const order = await razorpay.orders.create({
    amount: params.amount * 100, // Convert to paise
    currency: 'INR',
    receipt: `customer_${params.customerId}_${Date.now()}`,
    notes: params.notes || {},
  });
  
  return order as unknown as RazorpayOrder;
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const crypto = require('crypto');
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body.toString())
    .digest('hex');
  
  return expectedSignature === signature;
}
