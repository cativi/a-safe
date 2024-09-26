// a-safe/packages/api/jest.setup.ts

import dotenv from 'dotenv';
import { prismaMock } from './__mocks__/@prisma/client';

dotenv.config();
jest.setTimeout(30000);


jest.mock('@fastify/jwt', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
        return (instance: any, opts: any, done: () => void) => {
            instance.decorate('jwt', {
                sign: jest.fn().mockReturnValue('mocked.jwt.token'),
                verify: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
            });
            instance.decorate('authenticate', jest.fn().mockImplementation((request, reply, done) => {
                request.user = { id: '1', email: 'test@example.com' };
                done();
            }));
            done();
        };
    }),
}));

jest.mock('@fastify/multipart');
jest.mock('@fastify/websocket');
jest.mock('@fastify/swagger');
jest.mock('@fastify/swagger-ui');
jest.mock('socket.io');

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => prismaMock),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

global.prisma = prismaMock;

declare global {
    var prisma: typeof prismaMock;
}