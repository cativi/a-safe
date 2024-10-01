// a-safe/packages/api/tests/shareMyImage.test.ts:

import fs from 'fs';
import axios, { AxiosError } from 'axios';
import { ShareMyImageUploadError } from '../utils/errorHandler';
import { UploadOptions } from '../services/types';

// Mock the entire upload module
jest.mock('../services/upload', () => ({
    loginAsAdmin: jest.fn(),
    uploadToShareMyImage: jest.fn(),
}));

// Import the mocked functions
import { uploadToShareMyImage, loginAsAdmin } from '../services/upload';

jest.mock('fs');
jest.mock('axios');

describe('upload service', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        jest.resetAllMocks();
        originalEnv = process.env;
        process.env = { ...originalEnv };
        process.env.SHAREMYIMAGE_API_KEY = 'chv_test_key';
        process.env.ADMIN_EMAIL = 'admin@example.com';
        process.env.ADMIN_PASSWORD = 'password';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('loginAsAdmin', () => {
        it('should successfully login as admin', async () => {
            (loginAsAdmin as jest.Mock).mockResolvedValue('mocked_token');
            const result = await loginAsAdmin();
            expect(result).toBe('mocked_token');
        });

        it('should throw an error if login fails', async () => {
            (loginAsAdmin as jest.Mock).mockRejectedValue(new Error('Login failed'));
            await expect(loginAsAdmin()).rejects.toThrow('Login failed');
        });

        it('should throw an error if authentication throws', async () => {
            (loginAsAdmin as jest.Mock).mockRejectedValue(new Error('Authentication error'));
            await expect(loginAsAdmin()).rejects.toThrow('Authentication error');
        });
    });

    describe('uploadToShareMyImage', () => {
        beforeEach(() => {
            (loginAsAdmin as jest.Mock).mockResolvedValue('mocked_token');
        });

        it('should throw an error if file does not exist', async () => {
            (uploadToShareMyImage as jest.Mock).mockRejectedValue(new Error('File does not exist'));
            await expect(uploadToShareMyImage('/nonexistent/file.jpg', {})).rejects.toThrow('File does not exist');
        });

        it('should throw an error if API key is invalid', async () => {
            (uploadToShareMyImage as jest.Mock).mockRejectedValue(new Error('SHAREMYIMAGE_API_KEY is not set correctly'));
            await expect(uploadToShareMyImage('/path/to/file.jpg', {})).rejects.toThrow('SHAREMYIMAGE_API_KEY is not set correctly');
        });

        it('should upload file with correct options', async () => {
            const mockResponse = { status_code: 200, status_txt: 'OK' };
            (uploadToShareMyImage as jest.Mock).mockResolvedValue(mockResponse);

            const options: UploadOptions = { format: 'json', title: 'Test Image' };
            const result = await uploadToShareMyImage('/path/to/file.jpg', options);

            expect(result).toEqual(mockResponse);
            expect(uploadToShareMyImage).toHaveBeenCalledWith('/path/to/file.jpg', options);
        });

        it('should handle upload progress', async () => {
            const mockResponse = { status_code: 200, status_txt: 'OK' };
            (uploadToShareMyImage as jest.Mock).mockImplementation(() => {
                console.log('Upload progress: 50%');
                return Promise.resolve(mockResponse);
            });

            const consoleSpy = jest.spyOn(console, 'log');
            await uploadToShareMyImage('/path/to/file.jpg', {});

            expect(consoleSpy).toHaveBeenCalledWith('Upload progress: 50%');
        });

        it('should throw ShareMyImageUploadError on API error', async () => {
            (uploadToShareMyImage as jest.Mock).mockRejectedValue(new ShareMyImageUploadError('API Error', 400));
            await expect(uploadToShareMyImage('/path/to/file.jpg', {})).rejects.toThrow(ShareMyImageUploadError);
        });

        it('should handle timeout errors', async () => {
            (uploadToShareMyImage as jest.Mock).mockRejectedValue(new Error('timeout of 120000ms exceeded'));
            await expect(uploadToShareMyImage('/path/to/file.jpg', {})).rejects.toThrow('timeout of 120000ms exceeded');
        });

        it('should handle API key not recognized error', async () => {
            (uploadToShareMyImage as jest.Mock).mockRejectedValue(new ShareMyImageUploadError('API key was not recognized. Please check the key validity.', 401));
            await expect(uploadToShareMyImage('/path/to/file.jpg', {})).rejects.toThrow(ShareMyImageUploadError);
            await expect(uploadToShareMyImage('/path/to/file.jpg', {})).rejects.toThrow('API key was not recognized. Please check the key validity.');
        });
    });
});