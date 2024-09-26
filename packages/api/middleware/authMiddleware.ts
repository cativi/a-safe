// a-safe/packages/api/middleware/authMiddleware.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { JwtPayload } from 'jsonwebtoken';

// Define a custom interface for our JWT payload
interface CustomJwtPayload extends JwtPayload {
    role?: string;
}

// Extend the FastifyRequest to include our custom properties
declare module 'fastify' {
    interface FastifyRequest {
        customUser?: CustomJwtPayload;
    }
}

export function authorizeByPermission(roles: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const authorizationHeader = request.headers.authorization;
            if (!authorizationHeader) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const token = authorizationHeader.split(' ')[1];
            const decoded = verifyToken(token) as CustomJwtPayload;
            if (!decoded || !decoded.role || !roles.includes(decoded.role)) {
                return reply.status(403).send({ error: 'Forbidden' });
            }
            request.customUser = decoded;
        } catch (error) {
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    };
}

export function verifyJwtToken(request: FastifyRequest, reply: FastifyReply, done: () => void) {
    try {
        const authorizationHeader = request.headers.authorization;
        if (!authorizationHeader) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        const token = authorizationHeader.split(' ')[1];
        const decoded = verifyToken(token) as CustomJwtPayload;
        if (!decoded) {
            return reply.status(401).send({ error: 'Invalid token' });
        }
        request.customUser = decoded; // Attach the decoded token to the request
        done();
    } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
    }
}