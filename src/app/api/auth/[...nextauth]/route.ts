/**
 * NextAuth.js API Route Handler
 *
 * This file creates the authentication endpoints for the application:
 * - POST /api/auth/signin - Sign in with credentials
 * - POST /api/auth/signout - Sign out
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/csrf - Get CSRF token
 * - GET /api/auth/providers - Get available auth providers
 *
 * Documentation: https://next-auth.js.org/
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
