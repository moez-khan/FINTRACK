import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/saving-goals/[id] - Update saving goal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, target, saved, deadline } = body;

    // Check if saving goal exists and belongs to user
    const existingGoal = await prisma.savingGoal.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Saving goal not found' },
        { status: 404 }
      );
    }

    // Validation
    if (target !== undefined) {
      if (typeof target !== 'number' || target <= 0) {
        return NextResponse.json(
          { error: 'Target must be a positive number' },
          { status: 400 }
        );
      }
    }

    if (saved !== undefined) {
      if (typeof saved !== 'number' || saved < 0) {
        return NextResponse.json(
          { error: 'Saved amount must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    // Check if saved exceeds target
    const finalTarget = target !== undefined ? target : existingGoal.target;
    const finalSaved = saved !== undefined ? saved : existingGoal.saved;
    if (finalSaved > finalTarget) {
      return NextResponse.json(
        { error: 'Saved amount cannot exceed target' },
        { status: 400 }
      );
    }

    let parsedDeadline = undefined;
    if (deadline !== undefined) {
      parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return NextResponse.json(
          { error: 'Invalid deadline date format' },
          { status: 400 }
        );
      }
    }

    const updatedGoal = await prisma.savingGoal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(target !== undefined && { target }),
        ...(saved !== undefined && { saved }),
        ...(parsedDeadline !== undefined && { deadline: parsedDeadline })
      }
    });

    return NextResponse.json({
      message: 'Saving goal updated successfully',
      savingGoal: updatedGoal
    });
  } catch (error) {
    console.error('Error updating saving goal:', error);
    return NextResponse.json(
      { error: 'Failed to update saving goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/saving-goals/[id] - Delete saving goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if saving goal exists and belongs to user
    const existingGoal = await prisma.savingGoal.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Saving goal not found' },
        { status: 404 }
      );
    }

    await prisma.savingGoal.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Saving goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saving goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete saving goal' },
      { status: 500 }
    );
  }
}

// GET /api/saving-goals/[id] - Get single saving goal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const savingGoal = await prisma.savingGoal.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!savingGoal) {
      return NextResponse.json(
        { error: 'Saving goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ savingGoal });
  } catch (error) {
    console.error('Error fetching saving goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saving goal' },
      { status: 500 }
    );
  }
}