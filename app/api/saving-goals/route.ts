import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notification-service';

const prisma = new PrismaClient();

// GET /api/saving-goals - Get all saving goals for logged-in user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const savingGoals = await prisma.savingGoal.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        deadline: 'asc'
      }
    });

    return NextResponse.json({ savingGoals });
  } catch (error) {
    console.error('Error fetching saving goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saving goals' },
      { status: 500 }
    );
  }
}

// POST /api/saving-goals - Create new saving goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, target, saved, deadline } = body;

    // Validation
    if (!name || !target || deadline === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields (name, target, deadline)' },
        { status: 400 }
      );
    }

    if (typeof target !== 'number' || target <= 0) {
      return NextResponse.json(
        { error: 'Target must be a positive number' },
        { status: 400 }
      );
    }

    if (saved !== undefined && (typeof saved !== 'number' || saved < 0)) {
      return NextResponse.json(
        { error: 'Saved amount must be a non-negative number' },
        { status: 400 }
      );
    }

    if (saved !== undefined && saved > target) {
      return NextResponse.json(
        { error: 'Saved amount cannot exceed target' },
        { status: 400 }
      );
    }

    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return NextResponse.json(
        { error: 'Invalid deadline date format' },
        { status: 400 }
      );
    }

    // Check if deadline is in the future
    if (parsedDeadline < new Date()) {
      return NextResponse.json(
        { error: 'Deadline must be in the future' },
        { status: 400 }
      );
    }

    const savingGoal = await prisma.savingGoal.create({
      data: {
        name,
        target,
        saved: saved || 0,
        deadline: parsedDeadline,
        userId: session.user.id
      }
    });

    // Send immediate notification about the new goal
    await NotificationService.notifyGoalCreated(session.user.id, savingGoal);

    return NextResponse.json(
      { 
        message: 'Saving goal created successfully',
        savingGoal 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating saving goal:', error);
    return NextResponse.json(
      { error: 'Failed to create saving goal' },
      { status: 500 }
    );
  }
}