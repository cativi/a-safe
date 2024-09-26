// a-safe/packages/api/utils/errorHandler.ts:

import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import * as Sentry from '@sentry/node';

interface FastifyError extends Error {
    statusCode?: number;
    code?: string;
}

export class ShareMyImageUploadError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'ShareMyImageUploadError';
        this.statusCode = statusCode;
    }
}

export class FileUploadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FileUploadError';
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export const errorHandler = (
    error: Error | FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    console.error(error);

    // Capture error in Sentry
    Sentry.captureException(error);

    let statusCode = 500;
    let message = 'An unexpected error occurred';

    if (error instanceof ShareMyImageUploadError) {
        statusCode = error.statusCode;
        message = error.message;
    } else if (error instanceof FileUploadError) {
        statusCode = 400;
        message = error.message;
    } else if (error instanceof AuthenticationError) {
        statusCode = 401;
        message = error.message;
    } else if (error instanceof AuthorizationError) {
        statusCode = 403;
        message = error.message;
    } else if (error instanceof ZodError) {
        statusCode = 400;
        message = 'Validation error';
        const errorDetails = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        return reply.status(statusCode).send({ error: message, details: errorDetails });
    } else if ('statusCode' in error && typeof error.statusCode === 'number') {
        statusCode = error.statusCode;
        message = error.message;
    }

    if (statusCode === 415) {
        console.error('Content-Type received:', request.headers['content-type']);
    }

    reply.status(statusCode).send({ error: message });
};

export default errorHandler;