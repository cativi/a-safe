// a-safe/packages/api/types/global.d.ts:

/// <reference types="node" />
/// <reference types="jest" />

import { PrismaClient } from '@prisma/client'

// Declare a global Prisma client instance to be reused across the application
declare global {
    var prisma: PrismaClient // Add a global `prisma` variable of type `PrismaClient`
}
