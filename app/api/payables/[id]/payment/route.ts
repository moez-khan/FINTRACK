import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-with-retry';

// Make a payment towards a payable
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be positive' }, { status: 400 });
    }

    // Get the payable
    const payable = await prisma.payable.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!payable) {
      return NextResponse.json({ error: 'Payable not found' }, { status: 404 });
    }

    if (payable.isPaid) {
      return NextResponse.json({ error: 'This payable is already fully paid' }, { status: 400 });
    }

    const paymentAmount = parseFloat(amount);
    const newPaidAmount = payable.paidAmount + paymentAmount;
    const remainingAmount = payable.amount - newPaidAmount;

    // Check if payment exceeds remaining amount
    if (newPaidAmount > payable.amount) {
      return NextResponse.json({ 
        error: `Payment exceeds remaining amount. Remaining: ${(payable.amount - payable.paidAmount).toFixed(2)}` 
      }, { status: 400 });
    }

    // Update the payable
    const updateData: any = {
      paidAmount: newPaidAmount
    };

    // If fully paid, mark as paid
    if (newPaidAmount >= payable.amount) {
      updateData.isPaid = true;
      updateData.paidDate = new Date();
      updateData.paidAmount = payable.amount; // Ensure exact amount
    }

    const updatedPayable = await prisma.payable.update({
      where: { id: params.id },
      data: updateData
    });

    // Also create an expense entry for this payment
    await prisma.expense.create({
      data: {
        amount: paymentAmount,
        type: 'expense',
        category: `Debt Payment - ${payable.category}`,
        date: new Date(),
        notes: `Payment for: ${payable.name}${payable.description ? ` (${payable.description})` : ''}`,
        userId: session.user.id
      }
    });

    return NextResponse.json({ 
      message: updateData.isPaid ? 'Payable fully paid!' : 'Payment recorded successfully',
      payable: updatedPayable,
      payment: {
        amount: paymentAmount,
        remainingAmount: Math.max(0, payable.amount - newPaidAmount),
        isFullyPaid: updateData.isPaid
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}