// a-safe/packages/api/types/global.d.ts:

/// <reference types="node" />
/// <reference types="jest" />

import { PrismaClient } from '@prisma/client'

declare global {
    var prisma: PrismaClient
}
