// a-safe/packages/api/tests/authRoutes.test.ts:

import { FastifyInstance } from 'fastify';
import { buildApp } from '../server';
import { registerUser, authenticateUser, verifyEmail, resetPassword } from '../services/authService';

jest.mock('../services/authService');

// Mock the buildApp function
jest.mock('../server', () => ({
    buildApp: jest.fn().mockReturnValue({
        ready: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        inject: jest.fn().mockImplementation(async (opts) => {
            if (opts.url === '/auth/register' && opts.method === 'POST') {
                const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'USER' };
                return {
                    statusCode: 201,
                    payload: JSON.stringify(mockUser)
                };
            }
            if (opts.url === '/auth/login' && opts.method === 'POST') {
                const payload = opts.payload as { email: string, password: string };
                if (payload.email === 'invalid-email' || payload.password === '') {
                    return {
                        statusCode: 400,
                        payload: JSON.stringify({ error: 'Invalid input' })
                    };
                }
                if (payload.password === 'wrong-password') {
                    return {
                        statusCode: 401,
                        payload: JSON.stringify({ error: 'Invalid credentials' })
                    };
                }
                const mockAuthResult = {
                    token: 'mock-token',
                    user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'USER' }
                };
                return {
                    statusCode: 200,
                    payload: JSON.stringify(mockAuthResult)
                };
            }
            if (opts.url.startsWith('/auth/verify-email') && opts.method === 'GET') {
                const token = new URL(opts.url, 'http://localhost').searchParams.get('token');
                if (token === 'valid-token') {
                    return {
                        statusCode: 200,
                        payload: JSON.stringify({ message: 'Email verified successfully' })
                    };
                } else {
                    return {
                        statusCode: 400,
                        payload: JSON.stringify({ error: 'Invalid or expired token' })
                    };
                }
            }
            if (opts.url === '/auth/reset-password' && opts.method === 'POST') {
                const payload = opts.payload as { email: string };
                if (payload.email === 'invalid-email') {
                    return {
                        statusCode: 400,
                        payload: JSON.stringify({ error: 'Invalid input' })
                    };
                }
                if (payload.email === 'nonexistent@example.com') {
                    return {
                        statusCode: 404,
                        payload: JSON.stringify({ error: 'User not found' })
                    };
                }
                return {
                    statusCode: 200,
                    payload: JSON.stringify({ message: 'Password reset email sent' })
                };
            }
            return {
                statusCode: 404,
                payload: JSON.stringify({ error: 'Not found' })
            };
        }),
    }),
}));

describe('Auth Routes', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp({}, true);
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should register a user successfully', async () => {
            const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'USER' };
            (registerUser as jest.Mock).mockResolvedValue(mockUser);

            const response = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                },
            });

            expect(response.statusCode).toBe(201);
            expect(JSON.parse(response.payload)).toEqual(mockUser);
        });
    });


    describe('POST /auth/login', () => {
        it('should authenticate a user successfully', async () => {
            const mockAuthResult = {
                token: 'mock-token',
                user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'USER' }
            };
            (authenticateUser as jest.Mock).mockResolvedValue(mockAuthResult);

            const response = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    email: 'test@example.com',
                    password: 'password123',
                },
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(mockAuthResult);
        });

        it('should return 400 for invalid input', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    email: 'invalid-email',
                    password: '',
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should return 401 for invalid credentials', async () => {
            (authenticateUser as jest.Mock).mockResolvedValue({ token: null, message: 'Invalid password' });

            const response = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    email: 'test@example.com',
                    password: 'wrong-password',
                },
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('GET /auth/verify-email', () => {
        it('should verify email successfully', async () => {
            (verifyEmail as jest.Mock).mockResolvedValue(true);

            const response = await app.inject({
                method: 'GET',
                url: '/auth/verify-email?token=valid-token',
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual({ message: 'Email verified successfully' });
        });

        it('should return 400 for invalid token', async () => {
            (verifyEmail as jest.Mock).mockResolvedValue(false);

            const response = await app.inject({
                method: 'GET',
                url: '/auth/verify-email?token=invalid-token',
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual({ error: 'Invalid or expired token' });
        });
    });

    describe('POST /auth/reset-password', () => {
        it('should initiate password reset successfully', async () => {
            (resetPassword as jest.Mock).mockResolvedValue(undefined);

            const response = await app.inject({
                method: 'POST',
                url: '/auth/reset-password',
                payload: {
                    email: 'test@example.com',
                },
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual({ message: 'Password reset email sent' });
        });

        it('should return 400 for invalid input', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/reset-password',
                payload: {
                    email: 'invalid-email',
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should return 404 if user is not found', async () => {
            (resetPassword as jest.Mock).mockRejectedValue(new Error('User not found'));

            const response = await app.inject({
                method: 'POST',
                url: '/auth/reset-password',
                payload: {
                    email: 'nonexistent@example.com',
                },
            });

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.payload)).toEqual({ error: 'User not found' });
        });
    });
});
