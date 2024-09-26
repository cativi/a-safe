// a-safe/packages/api/tests/jwt.test.ts:

import { generateToken, verifyToken } from '../utils/jwt';

describe('JWT Utilities', () => {
    it('should generate a valid token', () => {
        const payload = { id: '123', email: 'test@example.com', role: 'user' };
        const token = generateToken(payload);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
    });

    it('should verify a valid token', () => {
        const payload = { id: '123', email: 'test@example.com', role: 'user' };
        const token = generateToken(payload);
        const decoded = verifyToken(token);
        expect(decoded).toMatchObject(payload);
    });

    it('should throw an error for an invalid token', () => {
        expect(() => verifyToken('invalid.token.here')).toThrow();
    });
});