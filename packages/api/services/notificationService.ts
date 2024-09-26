// a-safe/packages/api/services/notificationService.ts:

import { Server as SocketIOServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { sendEmail } from '../utils/emailService'

const prisma = new PrismaClient()

export class AdvancedNotificationService {
    private io: SocketIOServer

    constructor(io: SocketIOServer) {
        this.io = io
    }

    async sendUserNotification(userId: string, message: string, emailNotification: boolean = false) {
        await this.storeNotification(userId, message)
        this.io.to(userId).emit('notification', message)

        if (emailNotification) {
            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (user && user.email) {
                await sendEmail(user.email, 'New Notification', message)
            }
        }
    }

    async sendBroadcastNotification(message: string, emailNotification: boolean = false) {
        await this.storeNotification(null, message)
        this.io.emit('notification', message)

        if (emailNotification) {
            const users = await prisma.user.findMany({ where: { emailNotificationEnabled: true } })
            for (const user of users) {
                await sendEmail(user.email, 'New Broadcast Notification', message)
            }
        }
    }

    private async storeNotification(userId: string | null, message: string) {
        await prisma.notification.create({
            data: {
                userId,
                message,
            }
        })
    }

    async getUserNotifications(userId: string, page: number = 1, pageSize: number = 20) {
        const skip = (page - 1) * pageSize
        return await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip: skip
        })
    }

    async markNotificationAsRead(notificationId: string) {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        })
    }

    async deleteNotification(notificationId: string) {
        await prisma.notification.delete({
            where: { id: notificationId }
        })
    }

    async updateUserNotificationPreferences(userId: string, emailNotificationEnabled: boolean) {
        await prisma.user.update({
            where: { id: userId },
            data: { emailNotificationEnabled }
        })
    }
}

