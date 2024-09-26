// a-safe/packages/api/routes/authRoutes.ts

import { FastifyInstance } from 'fastify';
import { authorizeByPermission } from '../middleware/authMiddleware';
import {
    registerJsonSchema,
    loginJsonSchema,
    getUserJsonSchema,
    updateUserJsonSchema,
    deleteUserJsonSchema,
    resetPasswordJsonSchema,
    verifyEmailJsonSchema,
} from '../schemas/userSchemas';
import {
    registerRoute,
    loginRoute,
    getAllUsersRoute,
    getSingleUserRoute,
    updateUserRoute,
    deleteUserRoute,
} from './sharedRoutes';
import { resetPassword, verifyEmail } from '../services/authService';

const authRoutes = async (fastify: FastifyInstance) => {

    fastify.post('/register', { schema: registerJsonSchema }, registerRoute);
    fastify.post('/login', { schema: loginJsonSchema }, loginRoute);
    fastify.get('/users', { preHandler: [authorizeByPermission(['admin'])] }, getAllUsersRoute);
    fastify.get('/users/:id', { schema: getUserJsonSchema, preHandler: [authorizeByPermission(['admin', 'user'])] }, getSingleUserRoute);
    fastify.put('/users/:id', { schema: updateUserJsonSchema, preHandler: [authorizeByPermission(['admin', 'user'])] }, updateUserRoute);
    fastify.delete('/users/:id', { schema: deleteUserJsonSchema, preHandler: [authorizeByPermission(['admin'])] }, deleteUserRoute);

    // Auth-specific routes
    fastify.post('/reset-password', { schema: resetPasswordJsonSchema }, async (request, reply) => {
        const { email } = request.body as { email: string };
        await resetPassword(email);
        reply.send({ message: 'Password reset email sent' });
    });

    fastify.get('/verify-email/:token', { schema: verifyEmailJsonSchema }, async (request, reply) => {
        const { token } = request.params as { token: string };
        const result = await verifyEmail(token);
        if (result) {
            reply.send({ message: 'Email verified successfully' });
        } else {
            reply.code(400).send({ error: 'Invalid or expired verification token' });
        }
    });
};

export default authRoutes;