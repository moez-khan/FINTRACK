import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get authOptions
async function getAuthOptions() {
  const authModule = await import('../../../auth/[...nextauth]/route');
  return authModule.authOptions;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authOptions = await getAuthOptions();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the bill reminder belongs to the user
    const existingBill = await prisma.billReminder.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingBill) {
      return NextResponse.json({ error: 'Bill reminder not found' }, { status: 404 });
    }

    const updatedBill = await prisma.billReminder.update({
      where: { id: params.id },
      data: {
        isPaid: true
      }
    });

    return NextResponse.json(updatedBill);

  } catch (error) {
    console.error('Error marking bill as paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}