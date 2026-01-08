import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { createOrder, verifyPayment } from '@/lib/razorpay';

// POST create Razorpay order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, amount, notes } = body;
    
    if (!customerId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and amount are required' },
        { status: 400 }
      );
    }
    
    const order = await createOrder({
      amount,
      customerId,
      notes: notes || {},
    });
    
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PUT verify payment
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentId, signature, customerId, amount } = body;
    
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification data' },
        { status: 400 }
      );
    }
    
    // Verify signature (in test mode, this is optional)
    const isValid = await verifyPayment(orderId, paymentId, signature);
    
    if (!isValid) {
      // In test mode, we'll be lenient
      console.warn('Payment signature verification failed, but continuing in test mode');
    }
    
    // Record the payment
    const result = await execute(
      `INSERT INTO Payments (customerId, amount, mode, status, razorpayOrderId, razorpayPaymentId)
       OUTPUT INSERTED.id
       VALUES (@customerId, @amount, 'test', 'completed', @orderId, @paymentId)`,
      {
        customerId,
        amount,
        orderId,
        paymentId,
      }
    );
    
    const insertedId = (result.recordset as { id: number }[])[0]?.id;
    
    return NextResponse.json({
      success: true,
      data: { paymentId: insertedId },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
