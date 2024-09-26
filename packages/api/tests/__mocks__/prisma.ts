// a-safe/packages/api/tests/__mocks__/prisma.ts

import { mockDeep, MockProxy } from 'jest-mock-extended';
import { PrismaClient, User, Post, Notification } from '@prisma/client';

const prisma: MockProxy<PrismaClient> = mockDeep<PrismaClient>();

export default prisma;
