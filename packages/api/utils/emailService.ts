// a-safe/packages/api/utils/emailService.ts

import nodemailer from 'nodemailer';

// Function to create a Nodemailer transporter for sending emails using Gmail
export function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail', // Use Gmail service for sending emails
        auth: {
            user: process.env.EMAIL_USER, // Gmail user from environment variables
            pass: process.env.EMAIL_PASS // Gmail password from environment variables
        }
    });
}

// Function to send an email to a specified recipient
export async function sendEmail(to: string, subject: string, text: string) {
    // Create the transporter using the Gmail configuration
    const transporter = createTransporter();

    // Define email options, including the sender, recipient, subject, and body text
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender email address
        to: to, // Recipient email address
        subject: subject, // Subject of the email
        text: text, // Body text of the email
    };

    try {
        // Send the email using the configured transporter
        await transporter.sendMail(mailOptions);

        // Log a success message if not in a testing environment
        if (process.env.NODE_ENV !== 'test') {
            console.log('Email sent successfully');
        }
    } catch (error) {
        // Log an error message if email sending fails
        console.error('Error sending email:', error);
    }
}
