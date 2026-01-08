import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

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

export { razorpay };
