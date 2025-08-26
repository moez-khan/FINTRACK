import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { prisma, executeWithRetry } from '@/lib/prisma-with-retry';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await executeWithRetry(() => prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        selectedRule: true,
        savingsPercentage: true,
        currency: true,
      },
    }));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, selectedRule, savingsPercentage, currency } = await request.json();

    // Validate selectedRule
    const validRules = ['50-30-20', 'pay-yourself-first', 'smart-goal'];
    if (selectedRule && !validRules.includes(selectedRule)) {
      return NextResponse.json(
        { error: 'Invalid financial rule selected' },
        { status: 400 }
      );
    }

    // Validate savingsPercentage
    if (savingsPercentage !== undefined && (savingsPercentage < 1 || savingsPercentage > 50)) {
      return NextResponse.json(
        { error: 'Savings percentage must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Validate currency
    if (currency && !SUPPORTED_CURRENCIES[currency as keyof typeof SUPPORTED_CURRENCIES]) {
      return NextResponse.json(
        { error: 'Invalid currency selected' },
        { status: 400 }
      );
    }

    const updatedUser = await executeWithRetry(() => prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || null,
        selectedRule,
        savingsPercentage: savingsPercentage || 20,
        currency: currency || 'USD',
      },
      select: {
        id: true,
        email: true,
        name: true,
        selectedRule: true,
        savingsPercentage: true,
        currency: true,
      },
    }));

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}