// a-safe/packages/api/__mocks__/@prisma/client.ts:

import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

export const prismaMock = mockDeep<PrismaClient>()

const MockPrismaClient = jest.fn(() => prismaMock)

export { MockPrismaClient as PrismaClient }

beforeEach(() => {
    mockReset(prismaMock)
})