// a-safe/packages/api/types/fastify-extensions.d.ts

import { FastifyInstance, FastifyPlugin, FastifyRequest as OriginalFastifyRequest } from 'fastify'
import { Server as SocketIOServer, ServerOptions as SocketIOServerOptions } from 'socket.io'
import { Options } from 'multer'
import { ServerResponse } from 'http';
import { AdvancedNotificationService } from '../services/notificationService';

// Interface to define the request body structure for creating a post
export interface PostRequest {
    title: string;
    content: string;
    published?: boolean; // Optional boolean to indicate if the post should be published
}

// Interface to define a custom user object for request context
export interface CustomUser {
    id: string;
    email: string;
    role: string; // Role of the user, e.g., 'USER' or 'ADMIN'
}

// Extend the Fastify module to add custom properties and methods
declare module 'fastify' {
    interface FastifyInstance {
        io: SocketIOServer; // Add Socket.IO instance to Fastify for real-time events
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>; // Custom authentication function
        notificationService?: AdvancedNotificationService | null; // Add the notification service (optional)
    }

    // Extend FastifyRequest to add custom properties, such as file upload and user info
    interface FastifyRequest extends OriginalFastifyRequest {
        file?: {
            fieldname: string; // Field name specified in the form
            originalname: string; // Original file name on the user's computer
            encoding: string; // Encoding type of the file
            mimetype: string; // MIME type of the file
            size: number; // Size of the file in bytes
            destination: string; // Destination folder where the file is stored
            filename: string; // Name of the file on the server
            path: string; // Full path to the file
            buffer: Buffer; // Buffer containing the file data
        };
        files?: {
            [fieldname: string]: {
                fieldname: string; // Field name specified in the form
                originalname: string; // Original file name on the user's computer
                encoding: string; // Encoding type of the file
                mimetype: string; // MIME type of the file
                size: number; // Size of the file in bytes
                destination: string; // Destination folder where the file is stored
                filename: string; // Name of the file on the server
                path: string; // Full path to the file
                buffer: Buffer; // Buffer containing the file data
            }[];
        };
        user?: CustomUser; // Add a custom user object to the request for authenticated routes
        parts(): AsyncIterableIterator<MultipartFile>; // Method to handle multipart form data
    }
}

// Extend the 'fastify-multer' module to add multer-specific methods for file uploads
declare module 'fastify-multer' {
    interface FastifyMulter extends FastifyPlugin {
        single(fieldName: string): any; // Handle a single file upload for a given field
        array(fieldName: string, maxCount?: number): any; // Handle multiple file uploads for a given field
        fields(fields: Array<{ name: string; maxCount?: number }>): any; // Handle multiple fields with file uploads
        none(): any; // Handle requests without files
    }
    const multer: (options?: Options) => FastifyMulter;
    export = multer;
}

// Extend the 'fastify-socket.io' module to add Socket.IO as a Fastify plugin
declare module 'fastify-socket.io' {
    import { FastifyPluginCallback } from 'fastify';
    const fastifySocketIO: FastifyPluginCallback<SocketIOServerOptions>;
    export default fastifySocketIO;
}

// Extend the '@fastify/swagger-ui' module to add Swagger UI as a Fastify plugin
declare module '@fastify/swagger-ui' {
    import { FastifyPluginAsync } from 'fastify';

    export interface FastifySwaggerUiOptions {
        routePrefix?: string; // Prefix for the Swagger UI route
        uiConfig?: Record<string, any>; // Configuration for the Swagger UI
        uiHooks?: {
            onRequest?: (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void; // Hook before processing a request
            preHandler?: (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void; // Hook before the request handler
        };
        staticCSP?: boolean; // Enable/disable static Content Security Policy
        transformStaticCSP?: (header: string) => string; // Function to modify the static CSP header
    }

    const fastifySwaggerUi: FastifyPluginAsync<FastifySwaggerUiOptions>;
    export default fastifySwaggerUi;
}

// Extend the 'http' module to add a custom property to ServerResponse
declare module 'http' {
    interface ServerResponse {
        disableCSRF?: boolean; // Custom flag to disable CSRF protection for specific responses
    }
}
