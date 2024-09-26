// a-safe/packages/api/tests/authMiddleware.test.ts:

import { FastifyReply, FastifyRequest } from 'fastify';
import { authorizeByPermission, verifyJwtToken } from '../middleware/authMiddleware';
import { verifyToken } from '../utils/jwt';

jest.mock('../utils/jwt');

describe('authMiddleware', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;
    let mockDone: jest.Mock;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            customUser: undefined,
        };
        mockReply = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        mockDone = jest.fn();
    });

    describe('authorizeByPermission', () => {
        it('should allow access when user has the required role', async () => {
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            (verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });

            const middleware = authorizeByPermission(['admin']);
            await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

            expect(verifyToken).toHaveBeenCalledWith('valid_token');
            expect(mockRequest.customUser).toEqual({ role: 'admin' });
            expect(mockReply.status).not.toHaveBeenCalled();
            expect(mockReply.send).not.toHaveBeenCalled();
        });

        it('should return 401 when no token is provided', async () => {
            const middleware = authorizeByPermission(['admin']);
            await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 403 when user does not have the required role', async () => {
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            (verifyToken as jest.Mock).mockReturnValue({ role: 'user' });

            const middleware = authorizeByPermission(['admin']);
            await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

            expect(mockReply.status).toHaveBeenCalledWith(403);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Forbidden' });
        });

        it('should return 500 when an error occurs', async () => {
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            (verifyToken as jest.Mock).mockImplementation(() => {
                throw new Error('Some error');
            });

            const middleware = authorizeByPermission(['admin']);
            await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Internal Server Error' });
        });
    });

    describe('verifyJwtToken', () => {
        it('should call done() when a valid token is provided', () => {
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            (verifyToken as jest.Mock).mockReturnValue({ id: '1', email: 'test@example.com' });

            verifyJwtToken(mockRequest as FastifyRequest, mockReply as FastifyReply, mockDone);

            expect(verifyToken).toHaveBeenCalledWith('valid_token');
            expect(mockRequest.customUser).toEqual({ id: '1', email: 'test@example.com' });
            expect(mockDone).toHaveBeenCalled();
        });

        it('should return 401 when no token is provided', () => {
            verifyJwtToken(mockRequest as FastifyRequest, mockReply as FastifyReply, mockDone);

            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
            expect(mockDone).not.toHaveBeenCalled();
        });

        it('should return 401 when an invalid token is provided', () => {
            mockRequest.headers = { authorization: 'Bearer invalid_token' };
            (verifyToken as jest.Mock).mockReturnValue(null);

            verifyJwtToken(mockRequest as FastifyRequest, mockReply as FastifyReply, mockDone);

            expect(verifyToken).toHaveBeenCalledWith('invalid_token');
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Invalid token' });
            expect(mockDone).not.toHaveBeenCalled();
        });

        it('should return 500 when an error occurs', () => {
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            (verifyToken as jest.Mock).mockImplementation(() => {
                throw new Error('Some error');
            });

            verifyJwtToken(mockRequest as FastifyRequest, mockReply as FastifyReply, mockDone);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Internal Server Error' });
            expect(mockDone).not.toHaveBeenCalled();
        });
    });
});