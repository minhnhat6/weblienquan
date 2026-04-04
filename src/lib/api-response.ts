/**
 * API Response Helpers
 * Standardized response utilities for Next.js API routes
 */

import { NextResponse } from 'next/server';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Response Builders ─────────────────────────────────────────────────────────

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error API response
 */
export function errorResponse(error: string, status = 400): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Create a validation error response (400)
 */
export function validationError(error: string): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 400);
}

/**
 * Create an unauthorized error response (401)
 */
export function unauthorizedError(error = 'Unauthorized'): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 401);
}

/**
 * Create a forbidden error response (403)
 */
export function forbiddenError(error = 'Forbidden'): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 403);
}

/**
 * Create a not found error response (404)
 */
export function notFoundError(error = 'Not found'): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 404);
}

/**
 * Create a rate limit error response (429)
 */
export function rateLimitError(error = 'Too many requests'): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 429);
}

/**
 * Create an internal server error response (500)
 */
export function serverError(error = 'Internal server error'): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 500);
}

// ─── Error Handler Wrapper ─────────────────────────────────────────────────────

/**
 * Wrap an API handler with standard error handling
 * Usage: export const GET = withErrorHandler(async (req) => { ... })
 */
export function withErrorHandler<T>(
  handler: (req: Request) => Promise<NextResponse<T>>
) {
  return async (req: Request): Promise<NextResponse<T | ApiErrorResponse>> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API Error:', error);
      return serverError() as NextResponse<T | ApiErrorResponse>;
    }
  };
}
