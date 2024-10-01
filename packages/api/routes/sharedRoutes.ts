// a-safe/packages/api/routes/sharedRoutes.ts

import { RouteHandler } from 'fastify';
import { z } from 'zod';
import {
    registerUser,
    authenticateUser,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
} from '../services/authService';
import {
    UserCreateZodSchema,
    UserLoginZodSchema,
    UserUpdateZodSchema,
    GetUserParamsZodSchema,
} from '../schemas/userSchemas';

// Health check route to verify that the server is running
export const healthCheckRoute: RouteHandler = async (request, reply) => {
    reply.send({ status: 'OK' });
};

// Root route that returns a welcome message for the API
export const rootRoute: RouteHandler = async (request, reply) => {
    reply.send({ message: 'Welcome to the A-SAFE API' });
};

// Route for user registration
export const registerRoute: RouteHandler = async (request, reply) => {
    try {
        // Parse and validate the request body using Zod schema
        const userData = UserCreateZodSchema.parse(request.body);
        // Register a new user using the provided data
        const newUser = await registerUser(userData);
        reply.code(201).send(newUser);
    } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof z.ZodError) {
            // Send validation error response if the request body doesn't match the expected schema
            reply.code(400).send({ error: 'Validation failed', details: error.errors });
        } else if (error instanceof Error) {
            // Handle unexpected errors during user registration
            reply.code(500).send({ error: 'An unexpected error occurred', details: error.message });
        } else {
            reply.code(500).send({ error: 'An unknown error occurred' });
        }
    }
};

// Route for user login
export const loginRoute: RouteHandler = async (request, reply) => {
    // Parse and validate the login credentials using Zod schema
    const { email, password } = UserLoginZodSchema.parse(request.body);
    // Authenticate the user with the provided credentials
    const result = await authenticateUser(email, password);
    if (!result.token) {
        // Send an error response if the credentials are invalid
        reply.code(401).send({ error: 'Invalid credentials' });
    } else {
        // Send the authentication result (token) if login is successful
        reply.send(result);
    }
};

// Route to get all users (used by admin)
export const getAllUsersRoute: RouteHandler = async (request, reply) => {
    const users = await getAllUsers();
    reply.send(users);
};

// Route to get a single user by ID
export const getSingleUserRoute: RouteHandler = async (request, reply) => {
    // Parse and validate the request parameters using Zod schema
    const { id } = GetUserParamsZodSchema.parse(request.params);
    // Retrieve the user by ID
    const user = await getUser(id);
    if (!user) {
        // Send an error response if the user is not found
        reply.code(404).send({ error: 'User not found' });
    } else {
        // Send the user data if found
        reply.send(user);
    }
};

// Route to update user information
export const updateUserRoute: RouteHandler = async (request, reply) => {
    try {
        // Parse and validate the request parameters and body using Zod schema
        const { id } = GetUserParamsZodSchema.parse(request.params);
        const updateData = UserUpdateZodSchema.parse(request.body);

        // Assuming the authenticated user's information is attached to the request
        const authenticatedUser = request.user as { id: string; role: string };

        // Update the user and check if it was successful
        const updatedUser = await updateUser(id, updateData, authenticatedUser.id, authenticatedUser.role);

        if (!updatedUser) {
            // Send an error response if the user update fails
            reply.code(404).send({ error: 'User not found or update failed' });
        } else {
            // Send the updated user data if successful
            reply.send(updatedUser);
        }
    } catch (error) {
        if (error instanceof Error) {
            // Handle unauthorized error or any unexpected errors during update
            if (error.message.includes('Unauthorized')) {
                reply.code(403).send({ error: 'Forbidden', message: error.message });
            } else {
                reply.code(500).send({ error: 'An unexpected error occurred', message: error.message });
            }
        } else {
            reply.code(500).send({ error: 'An unknown error occurred' });
        }
    }
};

// Route to delete a user
export const deleteUserRoute: RouteHandler = async (request, reply) => {
    try {
        // Parse and validate the request parameters using Zod schema
        const { id } = GetUserParamsZodSchema.parse(request.params);

        // Assuming the authenticated user's information is attached to the request
        const authenticatedUser = request.user as { role: string };

        // Delete the user and check if it was successful
        const deletedUser = await deleteUser(id, authenticatedUser.role);

        if (!deletedUser) {
            // Send an error response if the user deletion fails
            reply.code(404).send({ error: 'User not found or deletion failed' });
        } else {
            // Send a success message if deletion is successful
            reply.send({ message: 'User deleted successfully' });
        }
    } catch (error) {
        if (error instanceof Error) {
            // Handle unauthorized error or any unexpected errors during deletion
            if (error.message.includes('Unauthorized')) {
                reply.code(403).send({ error: 'Forbidden', message: error.message });
            } else {
                reply.code(500).send({ error: 'An unexpected error occurred', message: error.message });
            }
        } else {
            reply.code(500).send({ error: 'An unknown error occurred' });
        }
    }
};
