// a-safe/packages/api/services/notificationService.ts

import { Server as SocketIOServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { sendEmail } from '../utils/emailService'

const prisma = new PrismaClient()

// Class for advanced notification handling using Socket.IO and email
export class AdvancedNotificationService {
    private io: SocketIOServer

    // Constructor to initialize Socket.IO server
    constructor(io: SocketIOServer) {
        this.io = io
    }

    // Send a notification to a specific user and optionally send an email notification
    async sendUserNotification(userId: string, message: string, emailNotification: boolean = false) {
        // Store the notification in the database
        await this.storeNotification(userId, message)

        // Emit the notification via Socket.IO to the specified user
        this.io.to(userId).emit('notification', message)

        // Send an email notification if requested
        if (emailNotification) {
            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (user && user.email) {
                await sendEmail(user.email, 'New Notification', message)
            }
        }
    }

    // Send a broadcast notification to all users and optionally send email notifications
    async sendBroadcastNotification(message: string, emailNotification: boolean = false) {
        // Store the broadcast notification in the database
        await this.storeNotification(null, message)

        // Emit the notification via Socket.IO to all users
        this.io.emit('notification', message)

        // Send email notifications to users who have enabled email notifications
        if (emailNotification) {
            const users = await prisma.user.findMany({ where: { emailNotificationEnabled: true } })
            for (const user of users) {
                await sendEmail(user.email, 'New Broadcast Notification', message)
            }
        }
    }

    // Store a notification in the database
    private async storeNotification(userId: string | null, message: string) {
        await prisma.notification.create({
            data: {
                userId, // Nullable userId to handle both user-specific and broadcast notifications
                message,
            }
        })
    }

    // Get notifications for a specific user with pagination
    async getUserNotifications(userId: string, page: number = 1, pageSize: number = 20) {
        const skip = (page - 1) * pageSize // Calculate the number of records to skip for pagination
        return await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }, // Order notifications by creation date in descending order
            take: pageSize, // Limit the number of results per page
            skip: skip
        })
    }

    // Mark a specific notification as read
    async markNotificationAsRead(notificationId: string) {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true } // Update the read status of the notification to true
        })
    }

    // Delete a specific notification by ID
    async deleteNotification(notificationId: string) {
        await prisma.notification.delete({
            where: { id: notificationId } // Delete the notification from the database
        })
    }

    // Update a user's notification preferences (enable/disable email notifications)
    async updateUserNotificationPreferences(userId: string, emailNotificationEnabled: boolean) {
        await prisma.user.update({
            where: { id: userId },
            data: { emailNotificationEnabled } // Update the user's email notification preference
        })
    }
}
