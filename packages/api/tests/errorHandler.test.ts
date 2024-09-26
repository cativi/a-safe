// a-safe/packages/api/utils/errorHandler.ts

import { errorHandler, ShareMyImageUploadError, FileUploadError } from '../utils/errorHandler';
import { FastifyReply, FastifyRequest } from 'fastify';

describe('errorHandler', () => {
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

    it('should handle ShareMyImageUploadError', () => {
        const error = new ShareMyImageUploadError('Upload failed', 400);
        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'Upload failed' });
    });

    it('should handle FileUploadError', () => {
        const error = new FileUploadError('File too large');
        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'File too large' });
    });

    it('should handle FastifyError with statusCode', () => {
        const error = new Error('Not Found') as any;
        error.statusCode = 404;
        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);

        expect(mockReply.status).toHaveBeenCalledWith(404);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'Not Found' });
    });

    it('should handle unknown errors', () => {
        const error = new Error('Unknown error');
        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);

        expect(mockReply.status).toHaveBeenCalledWith(500);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'An unexpected error occurred' });
    });

    it('should log the error', () => {
        const error = new Error('Test error');
        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);

        expect(console.error).toHaveBeenCalledWith(error);
    });

    it('should log content-type for 415 errors', () => {
        const error = new Error('Unsupported Media Type') as any;
        error.statusCode = 415;
        mockRequest = {
            headers: { 'content-type': 'application/xml' }
        };

        const consoleErrorSpy = jest.spyOn(console, 'error');

        errorHandler(error, mockRequest as FastifyRequest, mockReply as FastifyReply);

        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Content-Type received:', 'application/xml');
        expect(mockReply.status).toHaveBeenCalledWith(415);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unsupported Media Type' });

        consoleErrorSpy.mockRestore();
    });
});