// a-safe/packages/api/middleware/authMiddleware.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { JwtPayload } from 'jsonwebtoken';

// Define a custom interface for JWT payload to include additional properties like role
interface CustomJwtPayload extends JwtPayload {
    role?: string;
}

// Extend the FastifyRequest interface to include a custom property 'customUser' for storing user information from JWT
declare module 'fastify' {
    interface FastifyRequest {
        customUser?: CustomJwtPayload;
    }
}

// Middleware function for authorizing users based on their roles
export function authorizeByPermission(roles: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const authorizationHeader = request.headers.authorization;
            // Check if the authorization header is present
            if (!authorizationHeader) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            // Extract the token from the header
            const token = authorizationHeader.split(' ')[1];
            // Verify the token and decode it
            const decoded = verifyToken(token) as CustomJwtPayload;
            // Check if the decoded payload is valid and contains a role that is allowed
            if (!decoded || !decoded.role || !roles.includes(decoded.role)) {
                return reply.status(403).send({ error: 'Forbidden' });
            }
            // Attach the decoded user information to the request object
            request.customUser = decoded;
        } catch (error) {
            // Handle unexpected errors
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    };
}

// Middleware function to verify the JWT token and add decoded information to the request
export function verifyJwtToken(request: FastifyRequest, reply: FastifyReply, done: () => void) {
    try {
        const authorizationHeader = request.headers.authorization;
        // Check if the authorization header is present
        if (!authorizationHeader) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        // Extract the token from the header
        const token = authorizationHeader.split(' ')[1];
        // Verify the token and decode it
        const decoded = verifyToken(token) as CustomJwtPayload;
        // Check if the decoded payload is valid
        if (!decoded) {
            return reply.status(401).send({ error: 'Invalid token' });
        }
        // Attach the decoded user information to the request object
        request.customUser = decoded;
        // Proceed to the next middleware or route handler
        done();
    } catch (error) {
        // Handle unexpected errors
        reply.status(500).send({ error: 'Internal Server Error' });
    }
}
