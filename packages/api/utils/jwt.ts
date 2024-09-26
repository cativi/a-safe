// a-safe/packages/api/utils/jwt.ts:

import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}

interface CustomJwtPayload extends JwtPayload {
    role?: string;
}

export const generateToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

export const verifyToken = (token: string): CustomJwtPayload => {
    return jwt.verify(token, JWT_SECRET) as CustomJwtPayload;
};