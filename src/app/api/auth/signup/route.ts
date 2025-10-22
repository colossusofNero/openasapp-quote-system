/**
 * User Registration (Signup) Endpoint
 *
 * POST /api/auth/signup
 *
 * Creates a new user account with email and password
 *
 * @example
 * curl -X POST http://localhost:3000/api/auth/signup \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "newuser@example.com",
 *     "name": "New User",
 *     "password": "securepassword123"
 *   }'
 */

import { NextRequest } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  ErrorResponses,
  parseRequestBody,
  withErrorHandling,
} from '@/lib/api/response';

// Validation schema for signup request
const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Parse and validate request body
  const result = await parseRequestBody(request, SignupSchema);
  if (!result.success) {
    return result.error;
  }

  const { email, name, password } = result.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return ErrorResponses.badRequest('An account with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        role: 'user', // Default role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return successResponse(
      {
        user,
        message: 'Account created successfully. You can now sign in.',
      },
      201
    );
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
});
