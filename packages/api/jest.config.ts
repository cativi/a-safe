// a-safe/packages/api/jest.config.ts

import dotenv from 'dotenv';
dotenv.config();
import type { Config } from '@jest/types';
import path from 'path';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
    roots: ['<rootDir>'],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }],
    },
    resolver: path.resolve(__dirname, 'customResolver.js'),
    moduleDirectories: ['node_modules', path.join(__dirname, 'node_modules')],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '^@prisma/client$': path.resolve(__dirname, '__mocks__/@prisma/client.ts'),
        '^shared-utils$': path.resolve(__dirname, '__mocks__/shared-utils.ts'),
        '^shared-utils/(.*)$': path.resolve(__dirname, '../shared-utils/$1'),
        '^@utils/(.*)$': path.resolve(__dirname, 'types/$1')
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testPathIgnorePatterns: ['/dist/'],
    modulePathIgnorePatterns: ["<rootDir>/dist/"],
    modulePaths: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    transformIgnorePatterns: ['/node_modules/(?!@prisma/client).+\\.js$'],
};

export default config;