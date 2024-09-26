// packages/api/tests/inputValidation.test.ts:

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

describe('Register User Schema Validation', () => {
    const ajv = new Ajv();
    addFormats(ajv);

    const schema = {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            name: { type: 'string', minLength: 3 },
        },
    };

    const validate = ajv.compile(schema);

    it('should validate correct input', () => {
        const validPayload = { email: 'test@example.com', password: 'Password123', name: 'John' };
        const isValid = validate(validPayload);
        expect(isValid).toBe(true);
    });

    it('should return error for invalid email format', () => {
        const invalidPayload = { email: 'invalid-email', password: 'Password123', name: 'John' };
        const isValid = validate(invalidPayload);
        expect(isValid).toBe(false);
        expect(validate.errors).toContainEqual(
            expect.objectContaining({
                keyword: 'format',
                params: { format: 'email' },
            })
        );
    });

    it('should return error for too short password', () => {
        const invalidPayload = { email: 'test@example.com', password: '123', name: 'John' };
        const isValid = validate(invalidPayload);
        expect(isValid).toBe(false);
        expect(validate.errors).toContainEqual(
            expect.objectContaining({
                keyword: 'minLength',
                params: { limit: 6 },
            })
        );
    });

    it('should return error for too short name', () => {
        const invalidPayload = { email: 'test@example.com', password: 'Password123', name: 'Jo' };
        const isValid = validate(invalidPayload);
        expect(isValid).toBe(false);
        expect(validate.errors).toContainEqual(
            expect.objectContaining({
                keyword: 'minLength',
                params: { limit: 3 },
            })
        );
    });
});