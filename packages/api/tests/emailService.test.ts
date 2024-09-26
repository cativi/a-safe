// a-safe/packages/api/tests/emailService.test.ts:

import nodemailer from 'nodemailer';
import { sendEmail, createTransporter, setTransporter } from '../utils/emailService';

jest.mock('nodemailer');

describe('Email Service', () => {
    const mockSendMail = jest.fn();
    const mockTransporter = { sendMail: mockSendMail };

    beforeEach(() => {
        jest.resetModules();
        process.env.EMAIL_HOST = 'smtp.example.com';
        process.env.EMAIL_PORT = '587';
        process.env.EMAIL_SECURE = 'false';
        process.env.EMAIL_USER = 'user@example.com';
        process.env.EMAIL_PASS = 'password';
        process.env.EMAIL_FROM = 'sender@example.com';

        (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
        setTransporter(mockTransporter as unknown as nodemailer.Transporter);
    });

    it('should send an email successfully', async () => {
        mockSendMail.mockResolvedValue('Email sent');

        await sendEmail('recipient@example.com', 'Test Subject', 'Test Body');

        expect(mockSendMail).toHaveBeenCalledWith({
            from: 'sender@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test Body',
        });
    });

    it('should throw an error if sending email fails', async () => {
        mockSendMail.mockRejectedValue(new Error('SMTP error'));

        await expect(sendEmail('recipient@example.com', 'Test Subject', 'Test Body'))
            .rejects
            .toThrow('Failed to send email');

        expect(mockSendMail).toHaveBeenCalled();
    });

    it('should create transporter with correct config', () => {
        createTransporter();

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: {
                user: 'user@example.com',
                pass: 'password',
            },
        });
    });

    it('should use default port if EMAIL_PORT is not set', () => {
        delete process.env.EMAIL_PORT;
        createTransporter();

        expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
            port: 587,
        }));
    });

    it('should set secure to true if EMAIL_SECURE is "true"', () => {
        process.env.EMAIL_SECURE = 'true';
        createTransporter();

        expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
            secure: true,
        }));
    });
});