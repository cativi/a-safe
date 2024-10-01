// a-safe/packages/api/schemas/userSchemas.ts

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Prisma } from '@prisma/client';

// -------------------- Zod Schemas for Runtime Validation --------------------
// Zod schema for user creation/registration
export const UserCreateZodSchema = z.object({
    email: z.string().email(), // Validate that email is a valid string
    name: z.string().min(2).max(100).optional(), // Validate name length between 2-100 characters, optional
    password: z.string().min(8).max(255), // Validate password length between 8-255 characters
});

// Zod schema for user login
export const UserLoginZodSchema = z.object({
    email: z.string().email(), // Validate that email is a valid string
    password: z.string(), // Validate that password is a string
});

// Zod schema for user update
export const UserUpdateZodSchema = z.object({
    email: z.string().email().optional(), // Email is optional for updates
    name: z.string().min(2).max(100).optional(), // Name is optional for updates
    password: z.string().min(8).max(255).optional(), // Password is optional for updates
});

// Zod schemas for route parameters
export const GetUserParamsZodSchema = z.object({
    id: z.string().uuid(), // Validate that ID is a valid UUID
});

export const UpdateUserParamsZodSchema = z.object({
    id: z.string().uuid(), // Validate that ID is a valid UUID for updates
});

export const DeleteUserParamsZodSchema = z.object({
    id: z.string().uuid(), // Validate that ID is a valid UUID for deletion
});

// New schemas for reset password and email verification
export const ResetPasswordZodSchema = z.object({
    email: z.string().email(), // Validate that email is a valid string
});

export const VerifyEmailZodSchema = z.object({
    token: z.string().uuid(), // Validate that token is a valid UUID
});

// -------------------- JSON Schemas for Fastify Validation --------------------
// Convert Zod schemas to JSON Schemas
export const registerJsonSchema = {
    body: zodToJsonSchema(UserCreateZodSchema, { target: 'jsonSchema7' }), // JSON schema for user registration
    response: {
        201: zodToJsonSchema(
            z.object({
                id: z.string(), // Response will include user's ID
                email: z.string().email(), // Email is included in the response
                name: z.string(), // Name is included in the response
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const loginJsonSchema = {
    body: zodToJsonSchema(UserLoginZodSchema, { target: 'jsonSchema7' }), // JSON schema for user login
    response: {
        200: zodToJsonSchema(
            z.object({
                token: z.string(), // Response includes authentication token
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const getUserJsonSchema = {
    params: zodToJsonSchema(GetUserParamsZodSchema, { target: 'jsonSchema7' }), // JSON schema for getting user by ID
    response: {
        200: zodToJsonSchema(
            z.object({
                id: z.string(), // User ID
                email: z.string().email(), // User email
                name: z.string(), // User name
                role: z.enum(['USER', 'ADMIN']), // User role can be USER or ADMIN
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const updateUserJsonSchema = {
    params: zodToJsonSchema(UpdateUserParamsZodSchema, { target: 'jsonSchema7' }), // JSON schema for user update parameters
    body: zodToJsonSchema(UserUpdateZodSchema, { target: 'jsonSchema7' }), // JSON schema for updating user data
    response: {
        200: zodToJsonSchema(
            z.object({
                id: z.string(), // User ID after update
                email: z.string().email(), // Updated user email
                name: z.string(), // Updated user name
                role: z.enum(['USER', 'ADMIN']), // Updated user role
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const deleteUserJsonSchema = {
    params: zodToJsonSchema(DeleteUserParamsZodSchema, { target: 'jsonSchema7' }), // JSON schema for user deletion parameters
    response: {
        200: zodToJsonSchema(
            z.object({
                message: z.string(), // Response includes a confirmation message
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

// New JSON schemas for reset password and email verification
export const resetPasswordJsonSchema = {
    body: zodToJsonSchema(ResetPasswordZodSchema, { target: 'jsonSchema7' }), // JSON schema for resetting password
    response: {
        200: zodToJsonSchema(
            z.object({
                message: z.string(), // Response includes a confirmation message
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const verifyEmailJsonSchema = {
    params: zodToJsonSchema(VerifyEmailZodSchema, { target: 'jsonSchema7' }), // JSON schema for verifying email token
    response: {
        200: zodToJsonSchema(
            z.object({
                message: z.string(), // Response includes a confirmation message
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

// -------------------- Prisma User Select Type --------------------
// Define the fields to select when querying a user using Prisma
export const userSelect = {
    id: true, // Select user ID
    email: true, // Select user email
    name: true, // Select user name
    role: true, // Select user role
} as const;

// Type alias for the selected user fields using Prisma's UserGetPayload
export type UserSelect = Prisma.UserGetPayload<{ select: typeof userSelect }>;
