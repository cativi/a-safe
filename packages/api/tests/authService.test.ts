// a-safe/packages/api/tests/authService.test.ts

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('uuid');
jest.mock('../utils/emailService');

const mockPrismaCreate = jest.fn();
const mockPrismaFindUnique = jest.fn();
const mockPrismaFindMany = jest.fn();
const mockPrismaUpdate = jest.fn();
const mockPrismaDelete = jest.fn();
const mockPrismaFindFirst = jest.fn();

const mockPrisma = {
    user: {
        create: mockPrismaCreate,
        findUnique: mockPrismaFindUnique,
        findMany: mockPrismaFindMany,
        update: mockPrismaUpdate,
        delete: mockPrismaDelete,
        findFirst: mockPrismaFindFirst,
    },
};

jest.mock('../prisma', () => ({
    __esModule: true,
    default: mockPrisma,
}));

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../utils/emailService';
import { registerUser, authenticateUser, getAllUsers, getUser, updateUser, deleteUser, resetPassword, verifyEmail } from '../services/authService';

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock database
        mockPrismaCreate.mockReset();
        mockPrismaFindUnique.mockReset();
        mockPrismaFindMany.mockReset();
        mockPrismaUpdate.mockReset();
        mockPrismaDelete.mockReset();
        mockPrismaFindFirst.mockReset();
    });

    describe('registerUser', () => {
        it('should register a new user successfully', async () => {
            const mockUser = {
                email: 'newuser@example.com',
                password: 'password123',
                name: 'New User',
            };
            const hashedPassword = 'hashedPassword';
            const emailVerificationToken = 'mockVerificationToken';

            mockPrismaFindUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
            (uuidv4 as jest.Mock).mockReturnValue(emailVerificationToken);
            mockPrismaCreate.mockResolvedValue({ ...mockUser, id: '1', role: 'USER', emailVerificationToken });

            const result = await registerUser(mockUser);

            expect(bcrypt.hash).toHaveBeenCalledWith(mockUser.password, 10);
            expect(mockPrismaCreate).toHaveBeenCalledWith({
                data: {
                    email: mockUser.email,
                    password: hashedPassword,
                    name: mockUser.name,
                    emailVerificationToken,
                },
                select: { id: true, email: true, name: true, role: true, emailVerificationToken: true },
            });
            expect(sendEmail).toHaveBeenCalledWith(
                mockUser.email,
                'Verify your email',
                expect.stringContaining(emailVerificationToken)
            );
            expect(result).toEqual({
                id: '1',
                email: mockUser.email,
                name: mockUser.name,
                role: 'USER',
            });
        });

        it('should throw an error if user already exists', async () => {
            const mockUser = {
                email: 'existinguser@example.com',
                password: 'password123',
                name: 'Existing User',
            };

            mockPrismaFindUnique.mockResolvedValue({ id: '1' });

            await expect(registerUser(mockUser)).rejects.toThrow('Email already exists');
        });

        it('should handle case when name is not provided', async () => {
            const mockUser = {
                email: 'newuser@example.com',
                password: 'password123',
            };
            const hashedPassword = 'hashedPassword';
            const emailVerificationToken = 'mockVerificationToken';

            mockPrismaFindUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
            (uuidv4 as jest.Mock).mockReturnValue(emailVerificationToken);
            mockPrismaCreate.mockResolvedValue({ ...mockUser, id: '1', role: 'USER', emailVerificationToken, name: '' });

            const result = await registerUser(mockUser);

            expect(mockPrismaCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    name: '',
                }),
            }));
            expect(result.name).toBe('');
        });
    });

    describe('authenticateUser', () => {
        it('should authenticate a user successfully', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                password: 'hashedPassword',
                role: 'USER',
                emailVerified: true,
            };
            const email = 'user@example.com';
            const password = 'password123';
            const token = 'mockToken';

            mockPrismaFindUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue(token);

            const result = await authenticateUser(email, password);

            expect(mockPrismaFindUnique).toHaveBeenCalledWith({ where: { email } });
            expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser.id, email: mockUser.email, role: mockUser.role },
                expect.any(String),
                { expiresIn: '1h' }
            );
            expect(result).toEqual({ token, user: { id: mockUser.id, email: mockUser.email, name: undefined, role: mockUser.role } });
        });

        it('should return null token if user is not found', async () => {
            const email = 'nonexistent@example.com';
            const password = 'password123';

            mockPrismaFindUnique.mockResolvedValue(null);

            const result = await authenticateUser(email, password);
            expect(result).toEqual({ token: null, message: 'User not found' });
        });

        it('should return null token if password is incorrect', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                password: 'hashedPassword',
                role: 'USER',
                emailVerified: true,
            };
            const email = 'user@example.com';
            const password = 'wrongpassword';

            mockPrismaFindUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await authenticateUser(email, password);
            expect(result).toEqual({ token: null, message: 'Invalid password' });
        });

        it('should return null token if email is not verified', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                password: 'hashedPassword',
                role: 'USER',
                emailVerified: false,
            };
            const email = 'user@example.com';
            const password = 'password123';

            mockPrismaFindUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await authenticateUser(email, password);
            expect(result).toEqual({ token: null, message: 'Email not verified. Please verify your email before logging in.' });
        });

        it('should handle password comparison error', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                password: 'hashedPassword',
                role: 'USER',
                emailVerified: true,
            };
            const email = 'user@example.com';
            const password = 'password123';

            mockPrismaFindUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Comparison error'));

            // Mock console.error
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

            const result = await authenticateUser(email, password);

            expect(result).toEqual({ token: null, message: 'Internal server error' });
            expect(mockConsoleError).toHaveBeenCalledWith(
                "Error during password comparison for user:",
                email,
                "Error:",
                expect.any(Error)
            );

            // Restore console.error
            mockConsoleError.mockRestore();
        });
    });

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            const mockUsers = [
                { id: '1', email: 'user1@example.com', name: 'User 1', role: 'USER' },
                { id: '2', email: 'user2@example.com', name: 'User 2', role: 'ADMIN' },
            ];
            mockPrismaFindMany.mockResolvedValue(mockUsers);

            const result = await getAllUsers();

            expect(result).toEqual(mockUsers);
            expect(mockPrismaFindMany).toHaveBeenCalledWith({
                select: { id: true, email: true, name: true, role: true },
            });
        });
    });

    describe('getUser', () => {
        it('should return a user by ID', async () => {
            const mockUser = { id: '1', email: 'user@example.com', name: 'Test User', role: 'USER' };
            mockPrismaFindUnique.mockResolvedValue(mockUser);

            const result = await getUser('1');

            expect(result).toEqual(mockUser);
            expect(mockPrismaFindUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                select: { id: true, email: true, name: true, role: true },
            });
        });

        it('should return null if user is not found', async () => {
            mockPrismaFindUnique.mockResolvedValue(null);

            const result = await getUser('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('updateUser', () => {
        it('should update user information', async () => {
            const updatedUser = { id: '1', email: 'updated@example.com', name: 'Updated User', role: 'USER' };
            mockPrismaUpdate.mockResolvedValue(updatedUser);
            (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');

            const result = await updateUser('1', { email: 'updated@example.com', name: 'Updated User', password: 'newpassword' }, '1', 'ADMIN');

            expect(result).toEqual(updatedUser);
            expect(mockPrismaUpdate).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    email: 'updated@example.com',
                    name: 'Updated User',
                    password: 'new_hashed_password',
                },
                select: { id: true, email: true, name: true, role: true },
            });
        });

        it('should throw an error if non-admin user tries to update another user', async () => {
            await expect(updateUser('1', { name: 'New Name' }, '2', 'USER'))
                .rejects.toThrow('Unauthorized: You can only update your own information or act as an admin.');
        });

        it('should allow admin to update any user', async () => {
            const updatedUser = { id: '1', email: 'user@example.com', name: 'New Name', role: 'USER' };
            mockPrismaUpdate.mockResolvedValue(updatedUser);

            const result = await updateUser('1', { name: 'New Name' }, '2', 'ADMIN');

            expect(result).toEqual(updatedUser);
        });
    });

    describe('deleteUser', () => {
        it('should delete a user', async () => {
            const deletedUser = { id: '1', email: 'deleted@example.com', name: 'Deleted User', role: 'USER' };
            mockPrismaDelete.mockResolvedValue(deletedUser);

            const result = await deleteUser('1', 'ADMIN');

            expect(result).toEqual(deletedUser);
            expect(mockPrismaDelete).toHaveBeenCalledWith({
                where: { id: '1' },
                select: { id: true, email: true, name: true, role: true },
            });
        });

        it('should throw an error if non-admin user tries to delete a user', async () => {
            await expect(deleteUser('1', 'USER'))
                .rejects.toThrow('Unauthorized: Only admins can delete users.');
        });
    });

    describe('resetPassword', () => {
        it('should reset user password', async () => {
            const mockUser = { id: '1', email: 'user@example.com' };
            mockPrismaFindUnique.mockResolvedValue(mockUser);
            (uuidv4 as jest.Mock).mockReturnValue('reset-token');

            await resetPassword('user@example.com');

            expect(mockPrismaUpdate).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { resetPasswordToken: 'reset-token' },
            });
            expect(sendEmail).toHaveBeenCalledWith('user@example.com', 'Reset your password', expect.stringContaining('reset-token'));
        });

        it('should throw an error if user is not found', async () => {
            mockPrismaFindUnique.mockResolvedValue(null);

            await expect(resetPassword('nonexistent@example.com')).rejects.toThrow('User not found');
        });
    });

    describe('verifyEmail', () => {
        it('should verify user email', async () => {
            const mockUser = { id: '1', email: 'user@example.com' };
            mockPrismaFindFirst.mockResolvedValue(mockUser);

            const result = await verifyEmail('verification-token');

            expect(result).toBe(true);
            expect(mockPrismaUpdate).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { emailVerified: true, emailVerificationToken: null },
            });
        });

        it('should return false if verification token is invalid', async () => {
            mockPrismaFindFirst.mockResolvedValue(null);

            const result = await verifyEmail('invalid-token');

            expect(result).toBe(false);
        });
    });
});