// a-safe/packages/api/server.ts

import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifyJwt, { FastifyJWTOptions } from '@fastify/jwt';
import fastifyCors, { FastifyCorsOptions } from '@fastify/cors';
import fastifyMultipart, { FastifyMultipartOptions } from '@fastify/multipart';
import fastifyWebsocket from '@fastify/websocket';
import fastifyHelmet from '@fastify/helmet';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyRateLimit, { FastifyRateLimitOptions } from '@fastify/rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

import setupSwagger from './config/swagger';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import { AdvancedNotificationService } from './services/notificationService';
import { DateUtils } from '../shared-utils';
import errorHandler from './utils/errorHandler';

const prisma = new PrismaClient();

// Add these type declarations at the top of your file
declare module 'fastify' {
    interface FastifyInstance {
        jwt: {
            sign: (payload: any, options?: any) => string;
            verify: (token: string, options?: any) => any;
        };
    }
    interface FastifyRequest {
        jwtVerify: (options?: any) => Promise<any>;
    }
}

export function buildApp(opts: FastifyServerOptions = {}, testing = false): FastifyInstance {
    const app: FastifyInstance = Fastify({
        logger: testing ? false : (process.env.NODE_ENV !== 'test' ? {
            level: process.env.LOG_LEVEL || 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            },
        } : false),
        ...opts
    });

    // Register plugins
    if (!testing && process.env.NODE_ENV !== 'test') {
        app.register<FastifyJWTOptions>(fastifyJwt as any, {
            secret: process.env.JWT_SECRET || (() => {
                throw new Error('JWT_SECRET is not set in environment variables');
            })()
        });
        app.register<FastifyCorsOptions>(fastifyCors as any, {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
            credentials: true,
        });
        app.register<FastifyMultipartOptions>(fastifyMultipart as any, {
            limits: {
                fileSize: 1000000, // 1MB
            },
        });
        app.register(fastifyWebsocket as any);
        app.register(fastifyHelmet as any);
        app.register(fastifyCsrf as any);
        app.register<FastifyRateLimitOptions>(fastifyRateLimit as any, {
            global: true,
            max: 100,
            timeWindow: '1 minute'
        } as FastifyRateLimitOptions);
    }

    // Setup Swagger
    setupSwagger(app, {});

    // Register routes
    app.register(authRoutes, { prefix: '/auth' });
    app.register(userRoutes, { prefix: '/users' });
    app.register(uploadRoutes, { prefix: '/upload' });

    // Set custom error handler
    app.setErrorHandler(errorHandler);

    // Setup Socket.IO
    let notificationService: AdvancedNotificationService;

    if (process.env.NODE_ENV !== 'test') {
        app.ready().then(() => {
            const io = new SocketIOServer(app.server);
            notificationService = new AdvancedNotificationService(io);
        });
    }

    // Logging Hooks
    app.addHook('onRequest', (request, reply, done) => {
        if (process.env.NODE_ENV !== 'test') {
            request.log.info({
                url: request.url,
                method: request.method,
                timestamp: DateUtils.formatDate(new Date()),
            }, 'Incoming request');
        }
        done();
    });

    app.addHook('onResponse', (request, reply, done) => {
        if (process.env.NODE_ENV !== 'test') {
            request.log.info({
                url: request.url,
                method: request.method,
                statusCode: reply.statusCode,
                timestamp: DateUtils.formatDate(new Date()),
                responseTime: reply.elapsedTime,
            }, 'Request completed');
        }
        done();
    });

    // Global Authentication Hook
    app.addHook('onRequest', async (request, reply) => {
        try {
            const publicPaths = ['/auth/login', '/auth/register', '/documentation'];
            if (publicPaths.some(path => request.url.startsWith(path))) {
                return;
            }
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    return app;
}

let app: FastifyInstance | null = null;

// Graceful Shutdown
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
signals.forEach(signal => {
    process.on(signal, async () => {
        if (app) {
            app.log.info('Shutting down gracefully...');
            await app.close();
            await prisma.$disconnect();
            app.log.info('Server shut down successfully');
        }
        process.exit(0);
    });
});

export const start = async () => {
    app = buildApp();
    try {
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3003;
        const host = process.env.HOST || '0.0.0.0';
        await app.listen({ port, host });
        app.log.info(`Server listening on ${host}:${port}`);
        app.log.info(`API Documentation available on http://${host}:${port}/documentation`);
    } catch (err) {
        app.log.error(err);
        throw err;
    }
};

if (require.main === module) {
    start();
}

export default buildApp;