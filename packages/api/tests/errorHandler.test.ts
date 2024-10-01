// a-safe/packages/api/utils/errorHandler.ts

import { errorHandler, AuthenticationError, AuthorizationError, ShareMyImageUploadError } from '../utils/errorHandler';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

describe('errorHandler - additional tests', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
        mockRequest = {};
        mockReply = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        console.error = jest.fn(); // Mock console.error to prevent logging during tests
    });

    it('should handle AuthenticationError', () => {
        const error = new AuthenticationError('Authentication failed');
        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);
        expect(mockReply.status).toHaveBeenCalledWith(401);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'Authentication failed' });
    });

    it('should handle AuthorizationError', () => {
        const error = new AuthorizationError('Unauthorized access');
        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);
        expect(mockReply.status).toHaveBeenCalledWith(403);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized access' });
    });

    it('should handle ZodError', () => {
        const zodError = new ZodError([
            {
                code: 'invalid_type',
                expected: 'string',
                received: 'number',
                path: ['name'],
                message: 'Expected string, received number',
            },
        ]);
        errorHandler(zodError, mockRequest as FastifyRequest, mockReply as FastifyReply);
        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
            error: 'Validation error',
            details: [{ field: 'name', message: 'Expected string, received number' }],
        });
    });
    it('should handle ShareMyImageUploadError with custom status code', () => {
        const error = new ShareMyImageUploadError('Custom upload error', 422);
        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);
        expect(mockReply.status).toHaveBeenCalledWith(422);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'Custom upload error' });
    });

    it('should handle ShareMyImageUploadError constructor', () => {
        const error = new ShareMyImageUploadError('Custom upload error', 422);
        expect(error.message).toBe('Custom upload error');
        expect(error.statusCode).toBe(422);
        expect(error.name).toBe('ShareMyImageUploadError');
    });

    it('should handle errors with custom statusCode property', () => {
        const customError = new Error('Custom error') as any;
        customError.statusCode = 418; // I'm a teapot
        errorHandler(customError, mockRequest as FastifyRequest, mockReply as FastifyReply);
        expect(mockReply.status).toHaveBeenCalledWith(418);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'Custom error' });
    });

    it('should log additional details for 415 errors', () => {
        const error = new Error('Unsupported Media Type') as any;
        error.statusCode = 415;
        mockRequest.headers = { 'content-type': 'application/xml' };

        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);

        expect(console.error).toHaveBeenCalledWith('Content-Type received:', 'application/xml');
        expect(mockReply.status).toHaveBeenCalledWith(415);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unsupported Media Type' });
    });
});