// a-safe/packages/api/routes/postRoutes.ts

import { FastifyInstance } from 'fastify';
import { verifyJwtToken } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PostRequest {
    title: string;
    content: string;
    authorId: string;
    published: boolean;
}

export const postRoutes = async (server: FastifyInstance) => {
    server.post<{ Body: PostRequest }>('/posts', {
        schema: {
            body: {
                type: 'object',
                required: ['title', 'content', 'authorId'],
                properties: {
                    title: { type: 'string', minLength: 5, maxLength: 255 },
                    content: { type: 'string', minLength: 10 },
                    authorId: { type: 'string', format: 'uuid' }
                }
            }
        },
        preHandler: [verifyJwtToken]
    }, async (request, reply) => {
        const { title, content, authorId, published } = request.body;
        const post = await prisma.post.create({
            data: { title, content, authorId, published }
        });
        reply.status(201).send(post);
    });
};