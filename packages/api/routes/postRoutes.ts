// a-safe/packages/api/routes/postRoutes.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwtToken } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { PostRequest, CustomUser } from '../types/fastify-extensions';

const prisma = new PrismaClient(); // Create a new instance of PrismaClient to interact with the database

// Define the post-related routes for the Fastify instance
export const postRoutes = async (server: FastifyInstance) => {
    // Route to create a new post
    server.post<{ Body: PostRequest }>('/posts', {
        schema: {
            // Schema validation for the request body to ensure required fields and constraints
            body: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                    title: { type: 'string', minLength: 5, maxLength: 255 }, // Title must be between 5 and 255 characters
                    content: { type: 'string', minLength: 10 }, // Content must be at least 10 characters
                    published: { type: 'boolean' } // Optional field to indicate if the post is published
                }
            }
        },
        preHandler: [verifyJwtToken] // Middleware to verify JWT token and authenticate the user
    }, async (request: FastifyRequest<{ Body: PostRequest }>, reply: FastifyReply) => {
        const { title, content, published = false } = request.body;

        // Retrieve the user information from the request (added by verifyJwtToken middleware)
        const user = request.user as CustomUser | undefined;
        const authorId = user?.id;

        // If no user is authenticated, return an error response
        if (!authorId) {
            return reply.status(401).send({ error: 'User not authenticated' });
        }

        try {
            // Create a new post in the database
            const post = await prisma.post.create({
                data: { title, content, authorId, published }
            });
            // Send the created post in the response with status 201 (Created)
            reply.status(201).send(post);
        } catch (error) {
            // Log any errors that occur during post creation
            console.error('Error creating post:', error);
            // Send an error response with status 500 (Internal Server Error)
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
};
