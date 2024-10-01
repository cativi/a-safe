// a-safe/packages/api/utils/errorHandler.ts:

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import * as Sentry from '@sentry/node';

// Custom error class for errors related to uploading to ShareMyImage
export class ShareMyImageUploadError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'ShareMyImageUploadError';
        this.statusCode = statusCode;
    }
}

// Custom error class for file upload errors
export class FileUploadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FileUploadError';
    }
}

// Custom error class for authentication errors
export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

// Custom error class for authorization errors
export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

// Generic error handler function to handle and respond to different types of errors
export const errorHandler = (
    error: Error | FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    console.error('Error occurred:', error);

    // Capture the error in Sentry for monitoring and alerting
    Sentry.captureException(error);

    let statusCode = 500; // Default status code for unexpected errors
    let message = 'An unexpected error occurred'; // Default error message

    // Handle specific custom error types
    if (error instanceof ShareMyImageUploadError) {
        statusCode = error.statusCode; // Use custom status code
        message = error.message; // Use custom error message
    } else if (error instanceof FileUploadError) {
        statusCode = 400; // Bad request status code for file upload errors
        message = error.message;
    } else if (error instanceof AuthenticationError) {
        statusCode = 401; // Unauthorized status code for authentication errors
        message = error.message;
    } else if (error instanceof AuthorizationError) {
        statusCode = 403; // Forbidden status code for authorization errors
        message = error.message;
    } else if (error instanceof ZodError) {
        // Handle validation errors from Zod schemas
        statusCode = 400;
        message = 'Validation error';
        const errorDetails = error.errors.map(err => ({
            field: err.path.join('.'), // Join the field path to provide a clear location of the error
            message: err.message // Provide the validation error message
        }));
        return reply.status(statusCode).send({ error: message, details: errorDetails });
    } else if ('statusCode' in error && typeof error.statusCode === 'number') {
        // Handle errors that already have a status code property
        statusCode = error.statusCode;
        message = error.message;
    }

    // Log additional details for specific status codes, e.g., unsupported content type
    if (statusCode === 415) {
        console.error('Content-Type received:', request.headers['content-type']);
    }

    // Send the error response with the appropriate status code and message
    reply.status(statusCode).send({ error: message });
};

export default errorHandler;
