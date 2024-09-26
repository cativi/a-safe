// a-safe/packages/api/routes/userRoutes.ts

import { FastifyInstance } from 'fastify';
import { authorizeByPermission } from '../middleware/authMiddleware';
import {
    registerJsonSchema,
    loginJsonSchema,
    getUserJsonSchema,
    updateUserJsonSchema,
    deleteUserJsonSchema,
} from '../schemas/userSchemas';
import {
    registerRoute,
    loginRoute,
    getAllUsersRoute,
    getSingleUserRoute,
    updateUserRoute,
    deleteUserRoute,
} from './sharedRoutes';

export default async function userRoutes(fastify: FastifyInstance) {
    fastify.post('/register', { schema: registerJsonSchema }, registerRoute);
    fastify.post('/login', { schema: loginJsonSchema }, loginRoute);
    fastify.get('/', { preHandler: [authorizeByPermission(['admin'])] }, getAllUsersRoute);
    fastify.get('/:id', { schema: getUserJsonSchema, preHandler: [authorizeByPermission(['admin', 'user'])] }, getSingleUserRoute);
    fastify.put('/:id', { schema: updateUserJsonSchema, preHandler: [authorizeByPermission(['admin', 'user'])] }, updateUserRoute);
    fastify.delete('/:id', { schema: deleteUserJsonSchema, preHandler: [authorizeByPermission(['admin'])] }, deleteUserRoute);
}