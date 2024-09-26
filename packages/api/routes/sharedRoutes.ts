// a-safe/packages/api/routes/sharedRoutes.ts

import { RouteHandler } from 'fastify';
import {
    authenticateUser,
    registerUser,
    getUser,
    getAllUsers,
    updateUser,
    deleteUser,
} from '../services/authService';
import {
    UserCreateZodSchema,
    UserLoginZodSchema,
    UserUpdateZodSchema,
    GetUserParamsZodSchema,
    UpdateUserParamsZodSchema,
    DeleteUserParamsZodSchema,
} from '../schemas/userSchemas';

export const registerRoute: RouteHandler = async (request, reply) => {
    const userData = UserCreateZodSchema.parse(request.body);
    const newUser = await registerUser(userData);
    reply.code(201).send(newUser);
};

export const loginRoute: RouteHandler = async (request, reply) => {
    const { email, password } = UserLoginZodSchema.parse(request.body);
    const result = await authenticateUser(email, password);
    if (!result.token) {
        reply.code(401).send({ error: 'Invalid credentials' });
    } else {
        reply.send(result);
    }
};

export const getAllUsersRoute: RouteHandler = async (request, reply) => {
    const users = await getAllUsers();
    reply.send(users);
};

export const getSingleUserRoute: RouteHandler = async (request, reply) => {
    const { id } = GetUserParamsZodSchema.parse(request.params);
    const user = await getUser(id);
    if (!user) {
        reply.code(404).send({ error: 'User not found' });
    } else {
        reply.send(user);
    }
};

export const updateUserRoute: RouteHandler = async (request, reply) => {
    const { id } = UpdateUserParamsZodSchema.parse(request.params);
    const updateData = UserUpdateZodSchema.parse(request.body);
    const updatedUser = await updateUser(id, updateData);
    if (!updatedUser) {
        reply.code(404).send({ error: 'User not found or update failed' });
    } else {
        reply.send(updatedUser);
    }
};

export const deleteUserRoute: RouteHandler = async (request, reply) => {
    const { id } = DeleteUserParamsZodSchema.parse(request.params);
    const deletedUser = await deleteUser(id);
    if (!deletedUser) {
        reply.code(404).send({ error: 'User not found or deletion failed' });
    } else {
        reply.send({ message: 'User deleted successfully' });
    }
};