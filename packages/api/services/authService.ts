// a-safe/packages/api/services/authService.ts

import prisma from '../prisma';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../utils/emailService';
import { UserCreateZodSchema } from '../schemas/userSchemas';

// Define the User schema using Zod for validation
export const UserSchema = z.object({
    email: z.string().email(), // Validate email format
    name: z.string().min(2).max(100), // Validate name length
    password: z.string().min(8).max(255), // Validate password length
});

// Define the type for creating a user
export type UserCreate = z.infer<typeof UserSchema>;

// Function to generate a JWT token
const generateToken = (payload: { id: string; email: string; role: string }) => {
    const secret = process.env.JWT_SECRET || 'fallback_secret'; // Use environment secret or fallback value
    return jwt.sign(payload, secret, { expiresIn: '1h' }); // Generate a token with 1-hour expiration
};

// Register a new user
export async function registerUser(userData: z.infer<typeof UserCreateZodSchema>) {
    // Validate user data using Zod schema
    const validatedData = UserCreateZodSchema.parse(userData);
    const { email, password, name } = validatedData;

    // Check if the user already exists by email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('Email already exists');
    }

    // Hash the user's password for secure storage
    const hashedPassword = await hash(password, 10);

    // Create the new user in the database
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: name || '', // Use an empty string if name is not provided
            emailVerificationToken: uuidv4(), // Generate email verification token
        },
        select: { id: true, email: true, name: true, role: true, emailVerificationToken: true },
    });

    // Send a verification email to the new user
    await sendEmail(
        newUser.email,
        'Verify your email',
        `Please verify your email by clicking this link: ${process.env.APP_URL}/verify-email/${newUser.emailVerificationToken}`
    );

    return { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
}

// Authenticate a user and return a JWT token
export async function authenticateUser(email: string, password: string) {
    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { token: null, message: 'User not found' };
    }

    // Check if the email is verified before allowing login
    if (user.emailVerified === false) {
        return { token: null, message: 'Email not verified. Please verify your email before logging in.' };
    }

    // Compare the provided password with the stored hashed password
    try {
        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
            return { token: null, message: 'Invalid password' };
        }
    } catch (error) {
        console.error("Error during password comparison for user:", email, "Error:", error);
        return { token: null, message: 'Internal server error' };
    }

    // Generate a JWT token upon successful authentication
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

// Get all users with selected fields
export async function getAllUsers() {
    // Retrieve all users with selected fields
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true },
    });
    return users;
}

// Get a single user by ID with selected fields
export async function getUser(id: string) {
    // Retrieve a specific user by ID with selected fields
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, role: true },
    });
    return user;
}

// Update a user's information
export async function updateUser(id: string, userData: Partial<UserCreate>, requestingUserId: string, requestingUserRole: string) {
    // Ensure only the user themselves or an admin can update user data
    if (requestingUserId !== id && requestingUserRole !== 'ADMIN') {
        throw new Error('Unauthorized: You can only update your own information or act as an admin.');
    }

    // Validate and sanitize the input data for updates
    const updateData: Partial<UserCreate> = {};
    if (userData.email) {
        updateData.email = userData.email;
    }
    if (userData.name) {
        updateData.name = userData.name;
    }
    if (userData.password) {
        // Hash the new password before updating
        updateData.password = await hash(userData.password, 10);
    }

    // Update the user in the database
    const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, email: true, name: true, role: true },
    });
    return updatedUser;
}

// Delete a user by ID
export async function deleteUser(id: string, requestingUserRole: string) {
    // Only allow admins to delete users
    if (requestingUserRole !== 'ADMIN') {
        throw new Error('Unauthorized: Only admins can delete users.');
    }

    // Delete the user from the database
    const deletedUser = await prisma.user.delete({
        where: { id },
        select: { id: true, email: true, name: true, role: true },
    });
    return deletedUser;
}

// Reset password
export async function resetPassword(email: string) {
    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('User not found');
    }

    // Generate a reset token and update the user's reset token in the database
    const resetToken = uuidv4();
    await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: resetToken },
    });

    // Send the reset email with the reset token
    await sendEmail(email, 'Reset your password', `Click this link to reset your password: ${process.env.APP_URL}/reset-password/${resetToken}`);
}

// Verify email
export async function verifyEmail(token: string) {
    // Find the user by their email verification token
    const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
    if (!user) {
        return false;
    }

    // Update the user's email verification status
    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerificationToken: null },
    });

    return true;
}
