import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    },
    { status }
  );
}

/**
 * Handle Zod validation errors
 */
export function validationErrorResponse(error: ZodError): NextResponse<ApiResponse> {
  const formattedErrors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return errorResponse('VALIDATION_ERROR', 'Invalid request data', formattedErrors, 400);
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  badRequest: (message: string, details?: any) => errorResponse('BAD_REQUEST', message, details, 400),

  unauthorized: (message: string = 'Authentication required') =>
    errorResponse('UNAUTHORIZED', message, undefined, 401),

  forbidden: (message: string = 'Access denied') => errorResponse('FORBIDDEN', message, undefined, 403),

  notFound: (resource: string = 'Resource') =>
    errorResponse('NOT_FOUND', `${resource} not found`, undefined, 404),

  conflict: (message: string, details?: any) => errorResponse('CONFLICT', message, details, 409),

  serverError: (message: string = 'Internal server error', details?: any) =>
    errorResponse('INTERNAL_ERROR', message, details, 500),

  serviceUnavailable: (message: string = 'Service temporarily unavailable') =>
    errorResponse('SERVICE_UNAVAILABLE', message, undefined, 503),
};

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(handler: T): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }

      // Handle known errors
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('not found')) {
          return ErrorResponses.notFound();
        }
        if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
          return ErrorResponses.unauthorized(error.message);
        }
        if (error.message.includes('forbidden') || error.message.includes('permission')) {
          return ErrorResponses.forbidden(error.message);
        }

        // Default to server error
        return ErrorResponses.serverError(
          process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message,
          process.env.NODE_ENV === 'development' ? error.stack : undefined
        );
      }

      // Unknown error
      return ErrorResponses.serverError();
    }
  }) as T;
}

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: validationErrorResponse(error) };
    }
    return { success: false, error: ErrorResponses.badRequest('Invalid JSON body') };
  }
}

/**
 * Parse and validate query parameters
 */
export function parseQueryParams<T>(
  searchParams: URLSearchParams,
  schema: { parse: (data: unknown) => T }
): { success: true; data: T } | { success: false; error: NextResponse } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: validationErrorResponse(error) };
    }
    return { success: false, error: ErrorResponses.badRequest('Invalid query parameters') };
  }
}
