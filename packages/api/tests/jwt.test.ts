// a-safe/packages/api/tests/jwt.test.ts:

import { generateToken, verifyToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JWT Utilities', () => {
    const mockPayload = { id: '123', email: 'test@example.com', role: 'user' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should generate a valid token', () => {
        (jwt.sign as jest.Mock).mockReturnValue('mocked.jwt.token');
        const token = generateToken(mockPayload);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(jwt.sign).toHaveBeenCalledWith(mockPayload, expect.any(String), expect.any(Object));
    });

    it('should verify a valid token', () => {
        (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
        const token = 'valid.mocked.token';
        const decoded = verifyToken(token);
        expect(decoded).toMatchObject(mockPayload);
        expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });

    it('should throw an error for an invalid token', () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });
        expect(() => verifyToken('invalid.token.here')).toThrow('Invalid token');
    });
    it('should handle token verification failure', () => {
        process.env.JWT_SECRET = 'test-secret';
        const invalidToken = 'invalid.token.here';
        expect(() => verifyToken(invalidToken)).toThrow();
    });
});