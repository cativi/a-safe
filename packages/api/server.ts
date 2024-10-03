// a-safe/packages/api/server.ts

console.log('Starting server initialization');

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from the .env file

import Fastify, { FastifyInstance, FastifyReply, FastifyRequest, FastifyServerOptions } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyMultipart, { MultipartFile } from '@fastify/multipart';
import fastifyWebsocket from '@fastify/websocket';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fs from 'fs';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

import setupSwagger from './config/swagger';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import { postRoutes } from './routes/postRoutes';
import { healthCheckRoute, rootRoute } from './routes/sharedRoutes';
import { AdvancedNotificationService } from './services/notificationService';
import { DateUtils } from '../shared-utils';
import errorHandler from './utils/errorHandler';

console.log('Imports completed');

// Handle unhandled promise rejections to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize Prisma Client for database interaction
const prisma = new PrismaClient();

// Extend Fastify's instance type to include custom properties
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        notificationService?: AdvancedNotificationService | null; // Add the notification service (optional)
    }
}

console.log('Environment loaded, starting to build app');
// Function to build the Fastify app instance
export function buildApp(opts: FastifyServerOptions = {}, testing = false): FastifyInstance {
    const app: FastifyInstance = Fastify({
        logger: testing
            ? false
            : process.env.NODE_ENV !== 'test'
                ? {
                    level: process.env.LOG_LEVEL || 'info',
                    transport: {
                        target: 'pino-pretty',
                        options: {
                            translateTime: 'HH:MM:ss Z',
                            ignore: 'pid,hostname',
                        },
                    },
                }
                : false,
        ...opts,
    });

    // Create the uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Register plugins for app functionality
    if (!testing && process.env.NODE_ENV !== 'test') {
        console.log('Registering plugins');
        // Register JWT for authentication
        app.register(fastifyJwt, {
            secret: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET is not set in environment variables'); })(),
        });

        // Register CORS for handling cross-origin requests
        app.register(fastifyCors, {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
            credentials: true,
        });

        // Register multipart for handling file uploads
        app.register(fastifyMultipart, {
            limits: {
                fieldNameSize: 100,
                fieldSize: 100,
                fields: 10,
                fileSize: 10 * 1024 * 1024, // 10 MB file size limit
                files: 1,
                headerPairs: 2000,
            },
            onFile: (part: MultipartFile) => {
                part.file.on('data', (chunk) => {
                    // Handle chunk of data
                });
                part.file.on('end', () => {
                    // Handle when file has fully been received
                });
            },
        });

        // Register security and rate-limiting plugins
        app.register(fastifyWebsocket);
        app.register(fastifyHelmet);
        app.register(fastifyRateLimit, {
            global: true,
            max: 100,
            timeWindow: '1 minute',
        });
        console.log('Plugins registered');
    }

    // Define an authentication middleware for protected routes
    app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify(); // Verify JWT token
        } catch (err) {
            reply.send(err); // Send error if verification fails
        }
    });

    // Set up Swagger for API documentation
    setupSwagger(app, {});

    console.log('Registering routes');
    // Register public routes
    app.register(authRoutes, { prefix: '/auth' });
    app.get('/health', healthCheckRoute);
    app.get('/', rootRoute);

    // Setup Socket.IO and notification service
    let notificationService: AdvancedNotificationService | null = null;

    if (process.env.NODE_ENV !== 'test') {
        app.ready().then(() => {
            console.log('Socket.IO and notification service initializing');
            const io = new SocketIOServer(app.server);
            notificationService = new AdvancedNotificationService(io);
            app.notificationService = notificationService; // Assign it to FastifyInstance
            console.log('Socket.IO and notification service initialized');
        });
    }

    // Register protected routes (authenticated users only)
    app.register(async (protectedApp) => {
        protectedApp.addHook('onRequest', app.authenticate);
        protectedApp.register(userRoutes);
        protectedApp.register(uploadRoutes, { prefix: '/upload' });
        protectedApp.register(postRoutes);
    });

    // Set a custom handler for 404 Not Found errors
    app.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            error: 'Not Found',
            message: 'The requested resource does not exist. Please check the URL and try again.',
        });
    });

    // Set custom error handler for all routes
    app.setErrorHandler(errorHandler);

    // Hooks for logging incoming requests and responses
    app.addHook('onRequest', (request, reply, done) => {
        if (process.env.NODE_ENV !== 'test') {
            request.log.info(
                {
                    url: request.url,
                    method: request.method,
                    timestamp: DateUtils.formatDate(new Date()),
                },
                'Incoming request'
            );
        }
        done();
    });

    app.addHook('onResponse', (request, reply, done) => {
        if (process.env.NODE_ENV !== 'test') {
            request.log.info(
                {
                    url: request.url,
                    method: request.method,
                    statusCode: reply.statusCode,
                    timestamp: DateUtils.formatDate(new Date()),
                    responseTime: reply.getResponseTime(),
                },
                'Request completed'
            );
        }
        done();
    });

    console.log('App built successfully');
    return app;
}

let app: FastifyInstance | null = null;

// Graceful Shutdown: Handle termination signals to shut down the server gracefully
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
signals.forEach((signal) => {
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

// Function to start the server
export const start = async () => {
    console.log('Starting server...');
    try {
        await prisma.$connect();
        console.log('Database connected successfully');

        app = buildApp();
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3003;
        const host = process.env.HOST || '0.0.0.0';
        console.log(`Attempting to listen on ${host}:${port}`);
        await app.listen({ port, host });
        console.log(`Server is now listening on ${host}:${port}`);
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

// Start the server if this file is executed directly
if (require.main === module) {
    start();
}

export default buildApp;