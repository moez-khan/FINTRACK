import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-with-retry';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payable = await prisma.payable.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!payable) {
      return NextResponse.json({ error: 'Payable not found' }, { status: 404 });
    }

    return NextResponse.json({ payable });
  } catch (error) {
    console.error('Error fetching payable:', error);
    return NextResponse.json({ error: 'Failed to fetch payable' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, amount, description, dueDate, category, priority, notes, isPaid, paidAmount } = body;

    // Check if payable exists and belongs to user
    const existingPayable = await prisma.payable.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!existingPayable) {
      return NextResponse.json({ error: 'Payable not found' }, { status: 404 });
    }

    // Validation
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    if (paidAmount !== undefined && paidAmount < 0) {
      return NextResponse.json({ error: 'Paid amount cannot be negative' }, { status: 400 });
    }

    if (paidAmount !== undefined && amount !== undefined && paidAmount > amount) {
      return NextResponse.json({ error: 'Paid amount cannot exceed total amount' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount);
    
    // Handle payment status
    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
      if (isPaid) {
        updateData.paidDate = new Date();
        // If marking as paid, set paidAmount to full amount if not specified
        if (paidAmount === undefined) {
          updateData.paidAmount = existingPayable.amount;
        }
      } else {
        updateData.paidDate = null;
      }
    }

    // Auto-mark as paid if paidAmount equals total amount
    const totalAmount = amount !== undefined ? parseFloat(amount) : existingPayable.amount;
    const currentPaidAmount = paidAmount !== undefined ? parseFloat(paidAmount) : existingPayable.paidAmount;
    
    if (currentPaidAmount >= totalAmount) {
      updateData.isPaid = true;
      updateData.paidDate = new Date();
      updateData.paidAmount = totalAmount;
    }

    const payable = await prisma.payable.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({ 
      message: 'Payable updated successfully', 
      payable 
    });
  } catch (error) {
    console.error('Error updating payable:', error);
    return NextResponse.json({ error: 'Failed to update payable' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if payable exists and belongs to user
    const existingPayable = await prisma.payable.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!existingPayable) {
      return NextResponse.json({ error: 'Payable not found' }, { status: 404 });
    }

    await prisma.payable.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Payable deleted successfully' });
  } catch (error) {
    console.error('Error deleting payable:', error);
    return NextResponse.json({ error: 'Failed to delete payable' }, { status: 500 });
  }
}