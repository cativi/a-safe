// a-safe/packages/api/tests/emailService.test.ts:

import nodemailer from 'nodemailer';
import { sendEmail, createTransporter } from '../utils/emailService';

jest.mock('nodemailer');

describe('Email Service', () => {
    const mockSendMail = jest.fn();
    const mockTransporter = { sendMail: mockSendMail };

    beforeEach(() => {
        jest.resetModules();
        process.env.EMAIL_USER = 'user@example.com';
        process.env.EMAIL_PASS = 'password';
        (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    });

    it('should send an email successfully', async () => {
        mockSendMail.mockResolvedValue('Email sent');
        await sendEmail('recipient@example.com', 'Test Subject', 'Test Body');
        expect(mockSendMail).toHaveBeenCalledWith({
            from: 'user@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test Body',
        });
    });

    it('should log error if sending email fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        mockSendMail.mockRejectedValue(new Error('SMTP error'));
        await sendEmail('recipient@example.com', 'Test Subject', 'Test Body');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending email:', expect.any(Error));
        consoleErrorSpy.mockRestore();
    });

    it('should create transporter with correct config', () => {
        createTransporter();
        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            service: 'gmail',
            auth: {
                user: 'user@example.com',
                pass: 'password',
            },
        });
    });

    it('should log success message when email is sent (non-test environment)', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        mockSendMail.mockResolvedValue('Email sent');
        await sendEmail('recipient@example.com', 'Test Subject', 'Test Body');
        expect(consoleLogSpy).toHaveBeenCalledWith('Email sent successfully');
        consoleLogSpy.mockRestore();
        process.env.NODE_ENV = originalEnv;
    });
});