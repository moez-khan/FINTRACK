import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
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

    const { notificationIds, markAll } = await request.json();

    if (markAll) {
      // Mark all notifications as read
      const result = await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return NextResponse.json({ 
        message: `Marked ${result.count} notifications as read` 
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ 
        error: 'Invalid notificationIds array' 
      }, { status: 400 });
    }

    // Mark specific notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: user.id
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ 
      message: `Marked ${result.count} notifications as read` 
    });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}