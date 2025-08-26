import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, name, selectedRule, savingsPercentage } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate selectedRule
    const validRules = ['50-30-20', 'pay-yourself-first', 'smart-goal'];
    if (selectedRule && !validRules.includes(selectedRule)) {
      return NextResponse.json(
        { error: 'Invalid financial rule selected' },
        { status: 400 }
      );
    }

    // Validate savingsPercentage
    if (savingsPercentage && (savingsPercentage < 1 || savingsPercentage > 50)) {
      return NextResponse.json(
        { error: 'Savings percentage must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        selectedRule: selectedRule || '50-30-20',
        savingsPercentage: savingsPercentage || 20,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}