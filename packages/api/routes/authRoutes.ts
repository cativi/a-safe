// a-safe/packages/api/routes/authRoutes.ts

import { FastifyInstance } from 'fastify';
import { authorizeByPermission } from '../middleware/authMiddleware';
import { registerRoute, loginRoute } from './sharedRoutes';
import { getAllUsersRoute, getSingleUserRoute, updateUserRoute, deleteUserRoute } from './sharedRoutes';

// Define the authentication and user management routes for the Fastify instance
const authRoutes = async (fastify: FastifyInstance) => {
    // Route for user registration
    fastify.post('/register', registerRoute);

    // Route for user login
    fastify.post('/login', loginRoute);

    // Admin-only route to get all users
    fastify.get('/users', {
        preHandler: [authorizeByPermission(['admin'])], // Middleware to restrict access to admins only
        handler: getAllUsersRoute, // Handler function for getting all users
    });

    // Route to get a single user by ID, accessible by admins and the user themselves
    fastify.get('/users/:id', {
        preHandler: [authorizeByPermission(['admin', 'user'])], // Middleware to restrict access to admins and the specific user
        handler: getSingleUserRoute, // Handler function for getting a single user by ID
    });

    // Route to update user information, accessible by admins and the user themselves
    fastify.put('/users/:id', {
        preHandler: [authorizeByPermission(['admin', 'user'])], // Middleware to restrict access to admins and the specific user
        handler: updateUserRoute, // Handler function for updating user information
    });

    // Admin-only route to delete a user
    fastify.delete('/users/:id', {
        preHandler: [authorizeByPermission(['admin'])], // Middleware to restrict access to admins only
        handler: deleteUserRoute, // Handler function for deleting a user
    });
};

// Export the authRoutes function for use in the Fastify server configuration
export default authRoutes;
