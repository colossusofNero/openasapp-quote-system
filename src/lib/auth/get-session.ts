/**
 * Authentication Helper Utilities
 *
 * Provides helper functions for checking authentication status
 * and retrieving user session information in API routes.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import type { Session } from 'next-auth';

/**
 * Get the current user session
 *
 * @returns The current session or null if not authenticated
 *
 * @example
 * const session = await getSession();
 * if (!session) {
 *   return ErrorResponses.unauthorized();
 * }
 * const userId = session.user.id;
 */
export async function getSession(): Promise<Session | null> {
  return await getServerSession(authOptions);
}

/**
 * Require authentication - throws error if not authenticated
 *
 * @returns The current session
 * @throws Error if user is not authenticated
 *
 * @example
 * const session = await requireAuth();
 * // If we get here, user is authenticated
 * const userId = session.user.id;
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized - authentication required');
  }

  return session;
}

/**
 * Check if user has a specific role
 *
 * @param requiredRole - The role to check for (e.g., 'admin')
 * @returns True if user has the required role
 *
 * @example
 * const session = await requireAuth();
 * if (!await hasRole(session, 'admin')) {
 *   return ErrorResponses.forbidden('Admin access required');
 * }
 */
export function hasRole(session: Session, requiredRole: string): boolean {
  return session.user.role === requiredRole;
}

/**
 * Require a specific role - throws error if user doesn't have it
 *
 * @param requiredRole - The role to require (e.g., 'admin')
 * @returns The current session
 * @throws Error if user doesn't have the required role
 *
 * @example
 * const session = await requireRole('admin');
 * // If we get here, user is an admin
 */
export async function requireRole(requiredRole: string): Promise<Session> {
  const session = await requireAuth();

  if (!hasRole(session, requiredRole)) {
    throw new Error(`Forbidden - ${requiredRole} role required`);
  }

  return session;
}

/**
 * Get the current user ID
 *
 * @returns The user ID or null if not authenticated
 *
 * @example
 * const userId = await getUserId();
 * if (!userId) {
 *   return ErrorResponses.unauthorized();
 * }
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}
