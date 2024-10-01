// a-safe/packages/api/routes/userRoutes.ts

import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getAllUsersRoute, getSingleUserRoute, updateUserRoute, deleteUserRoute } from './sharedRoutes';

// Define the user-related routes for the Fastify instance
const userRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    console.log('Initializing userRoutes plugin in userRoutes.ts');

    // Route to get all users
    fastify.get('/users', getAllUsersRoute);
    // This route handles retrieving all users from the database. Typically accessible by admins.

    // Route to get a single user by ID
    fastify.get('/users/:id', getSingleUserRoute);
    // This route retrieves details of a specific user based on their ID.

    // Route to update a user's information
    fastify.put('/users/:id', updateUserRoute);
    // This route allows updating user information, typically accessible by admins or the user themselves.

    // Route to delete a user
    fastify.delete('/users/:id', deleteUserRoute);
    // This route allows deletion of a user, typically accessible by admins.
};

// Export the userRoutes plugin for use in the Fastify server configuration
export default userRoutes;
