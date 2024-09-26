// a-safe/packages/api/schemas/userSchemas.ts


import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Prisma } from '@prisma/client';

// -------------------- Zod Schemas for Runtime Validation --------------------
// Zod schema for user creation/registration
export const UserCreateZodSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2).max(100),
    password: z.string().min(8).max(255),
});

// Zod schema for user login
export const UserLoginZodSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Zod schema for user update
export const UserUpdateZodSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().min(2).max(100).optional(),
    password: z.string().min(8).max(255).optional(),
});

// Zod schemas for route parameters
export const GetUserParamsZodSchema = z.object({
    id: z.string().uuid(),
});

export const UpdateUserParamsZodSchema = z.object({
    id: z.string().uuid(),
});

export const DeleteUserParamsZodSchema = z.object({
    id: z.string().uuid(),
});

// New schemas for reset password and email verification
export const ResetPasswordZodSchema = z.object({
    email: z.string().email(),
});

export const VerifyEmailZodSchema = z.object({
    token: z.string().uuid(),
});

// -------------------- JSON Schemas for Fastify Validation --------------------
// Convert Zod schemas to JSON Schemas
export const registerJsonSchema = {
    body: zodToJsonSchema(UserCreateZodSchema, { target: 'jsonSchema7' }),
    response: {
        201: zodToJsonSchema(
            z.object({
                id: z.string(),
                email: z.string().email(),
                name: z.string(),
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const loginJsonSchema = {
    body: zodToJsonSchema(UserLoginZodSchema, { target: 'jsonSchema7' }),
    response: {
        200: zodToJsonSchema(
            z.object({
                token: z.string(),
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const getUserJsonSchema = {
    params: zodToJsonSchema(GetUserParamsZodSchema, { target: 'jsonSchema7' }),
    response: {
        200: zodToJsonSchema(
            z.object({
                id: z.string(),
                email: z.string().email(),
                name: z.string(),
                role: z.enum(['USER', 'ADMIN']),
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const updateUserJsonSchema = {
    params: zodToJsonSchema(UpdateUserParamsZodSchema, { target: 'jsonSchema7' }),
    body: zodToJsonSchema(UserUpdateZodSchema, { target: 'jsonSchema7' }),
    response: {
        200: zodToJsonSchema(
            z.object({
                id: z.string(),
                email: z.string().email(),
                name: z.string(),
                role: z.enum(['USER', 'ADMIN']),
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const deleteUserJsonSchema = {
    params: zodToJsonSchema(DeleteUserParamsZodSchema, { target: 'jsonSchema7' }),
    response: {
        200: zodToJsonSchema(
            z.object({
                message: z.string(),
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

// New JSON schemas for reset password and email verification
export const resetPasswordJsonSchema = {
    body: zodToJsonSchema(ResetPasswordZodSchema, { target: 'jsonSchema7' }),
    response: {
        200: zodToJsonSchema(
            z.object({
                message: z.string(),
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

export const verifyEmailJsonSchema = {
    params: zodToJsonSchema(VerifyEmailZodSchema, { target: 'jsonSchema7' }),
    response: {
        200: zodToJsonSchema(
            z.object({
                message: z.string(),
            }),
            { target: 'jsonSchema7' }
        ),
    },
};

// -------------------- Prisma User Select Type --------------------
export const userSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
} as const;

export type UserSelect = Prisma.UserGetPayload<{ select: typeof userSelect }>;