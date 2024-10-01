// a-safe/packages/api/utils/jwt.ts:

import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set'); // Ensure JWT_SECRET is defined
}

// Custom interface extending JwtPayload to include user-specific properties
interface CustomJwtPayload extends JwtPayload {
    id: string; // User ID
    role?: string; // Optional user role (e.g., 'USER', 'ADMIN')
}

// Function to generate a JWT token with a 1-hour expiration time
export const generateToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Use JWT_SECRET to sign the token
};

// Function to verify a JWT token and return the decoded payload
export const verifyToken = (token: string): CustomJwtPayload => {
    return jwt.verify(token, JWT_SECRET) as CustomJwtPayload; // Verify the token and cast it to CustomJwtPayload
};
