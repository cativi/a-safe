// a-safe/packages/api/tests/shareMyImage.test.ts:

import { uploadToShareMyImage } from '../services/upload';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import mime from 'mime-types';
import { ShareMyImageUploadError } from '../utils/errorHandler';
import { UploadOptions, ShareMyImageResponse } from '../services/types';

// Mock external modules
jest.mock('axios');
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        stat: jest.fn(),
    },
    createReadStream: jest.fn(),
}));
jest.mock('form-data');
jest.mock('mime-types');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const MockedFormData = FormData as jest.MockedClass<typeof FormData>;
const mockedMime = mime as jest.Mocked<typeof mime>;

describe('uploadToShareMyImage', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env.SHAREMYIMAGE_API_KEY = 'abcd1234efgh5678';
    });

    it('should successfully upload a file', async () => {
        // Cast fs.promises.stat to a mocked function
        const mockedStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
        mockedStat.mockResolvedValue({} as fs.Stats);

        // Mock fs.createReadStream
        const mockReadStream = {} as fs.ReadStream;
        mockedFs.createReadStream.mockReturnValue(mockReadStream);

        // Mock mime.lookup
        mockedMime.lookup.mockReturnValue('image/png');

        // Mock FormData behavior
        const mockFormDataInstance = new MockedFormData();
        MockedFormData.mockImplementation(() => mockFormDataInstance);

        // Mock axios.post to resolve with a successful response
        const mockResponse: ShareMyImageResponse = {
            status_code: 200,
            status_txt: 'OK',
            // ...other response data
        };
        mockedAxios.post.mockResolvedValue({ data: mockResponse });

        const filePath = '/path/to/image.png';
        const options: UploadOptions = {}; // Use valid UploadOptions properties if any

        const response = await uploadToShareMyImage(filePath, options);

        // Assertions
        expect(mockedStat).toHaveBeenCalledWith(filePath);
        expect(mockedFs.createReadStream).toHaveBeenCalledWith(filePath);
        expect(mockedMime.lookup).toHaveBeenCalledWith(filePath);

        expect(mockFormDataInstance.append).toHaveBeenCalledWith('source', mockReadStream, {
            filename: 'image.png',
            contentType: 'image/png',
        });
        // Add assertions for actual UploadOptions properties
        // Example:
        // expect(mockFormDataInstance.append).toHaveBeenCalledWith('title', 'Sample Title');

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://www.sharemyimage.com/api/1/upload',
            mockFormDataInstance,
            {
                headers: {
                    ...mockFormDataInstance.getHeaders(),
                    'X-API-Key': 'abcd1234efgh5678',
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            }
        );

        expect(response).toEqual(mockResponse);
    });

    it('should throw ShareMyImageUploadError when API returns non-200 status code', async () => {
        // Cast fs.promises.stat to a mocked function
        const mockedStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
        mockedStat.mockResolvedValue({} as fs.Stats);

        // Mock fs.createReadStream
        mockedFs.createReadStream.mockReturnValue({} as fs.ReadStream);

        // Mock mime.lookup
        mockedMime.lookup.mockReturnValue('image/png');

        // Mock FormData
        const mockFormDataInstance = new MockedFormData();
        MockedFormData.mockImplementation(() => mockFormDataInstance);

        // Mock axios.post to resolve with a non-200 response
        const mockResponse = {
            data: {
                status_code: 400,
                status_txt: 'Bad Request',
            },
        };
        mockedAxios.post.mockResolvedValue(mockResponse);

        const filePath = '/path/to/image.png';
        const options: UploadOptions = {};

        await expect(uploadToShareMyImage(filePath, options)).rejects.toThrow(ShareMyImageUploadError);

        await expect(uploadToShareMyImage(filePath, options)).rejects.toMatchObject({
            message: 'Upload failed: Bad Request',
            statusCode: 400,
        });
    });

    it('should throw ShareMyImageUploadError when axios error has response', async () => {
        // Cast fs.promises.stat to a mocked function
        const mockedStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
        mockedStat.mockResolvedValue({} as fs.Stats);

        // Mock fs.createReadStream
        mockedFs.createReadStream.mockReturnValue({} as fs.ReadStream);

        // Mock mime.lookup
        mockedMime.lookup.mockReturnValue('image/png');

        // Mock FormData
        MockedFormData.mockImplementation(() => ({
            append: jest.fn(),
            getHeaders: jest.fn().mockReturnValue({}),
        }) as unknown as FormData);

        // Mock axios.isAxiosError to return true
        mockedAxios.isAxiosError.mockReturnValue(true);

        // Mock axios.post to reject with an error containing a response
        const axiosError = {
            isAxiosError: true,
            response: {
                data: {
                    error: {
                        message: 'Invalid API Key',
                    },
                },
                status: 401,
            },
            message: 'Request failed with status code 401',
        };
        mockedAxios.post.mockRejectedValue(axiosError);

        const filePath = '/path/to/image.png';
        const options: UploadOptions = {};

        await expect(uploadToShareMyImage(filePath, options)).rejects.toThrow(ShareMyImageUploadError);

        await expect(uploadToShareMyImage(filePath, options)).rejects.toMatchObject({
            message: 'Upload error: Invalid API Key',
            statusCode: 401,
        });
    });

    it('should throw ShareMyImageUploadError when axios error has request but no response', async () => {
        // Cast fs.promises.stat to a mocked function
        const mockedStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
        mockedStat.mockResolvedValue({} as fs.Stats);

        // Mock fs.createReadStream
        mockedFs.createReadStream.mockReturnValue({} as fs.ReadStream);

        // Mock mime.lookup
        mockedMime.lookup.mockReturnValue('image/png');

        // Mock FormData
        MockedFormData.mockImplementation(() => ({
            append: jest.fn(),
            getHeaders: jest.fn().mockReturnValue({}),
        }) as unknown as FormData);

        // Mock axios.isAxiosError to return true
        mockedAxios.isAxiosError.mockReturnValue(true);

        // Mock axios.post to reject with an error containing a request but no response
        const axiosError = {
            isAxiosError: true,
            request: {},
            message: 'No response received',
        };
        mockedAxios.post.mockRejectedValue(axiosError);

        const filePath = '/path/to/image.png';
        const options: UploadOptions = {};

        await expect(uploadToShareMyImage(filePath, options)).rejects.toThrow(ShareMyImageUploadError);

        await expect(uploadToShareMyImage(filePath, options)).rejects.toMatchObject({
            message: 'No response received from ShareMyImage',
            statusCode: 500,
        });
    });

    it('should throw ShareMyImageUploadError when axios error occurs during request setup', async () => {
        // Cast fs.promises.stat to a mocked function
        const mockedStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
        mockedStat.mockResolvedValue({} as fs.Stats);

        // Mock fs.createReadStream
        mockedFs.createReadStream.mockReturnValue({} as fs.ReadStream);

        // Mock mime.lookup
        mockedMime.lookup.mockReturnValue('image/png');

        // Mock FormData
        MockedFormData.mockImplementation(() => ({
            append: jest.fn(),
            getHeaders: jest.fn().mockReturnValue({}),
        }) as unknown as FormData);

        // Mock axios.isAxiosError to return true
        mockedAxios.isAxiosError.mockReturnValue(true);

        // Mock axios.post to reject with an error without response or request
        const axiosError = {
            isAxiosError: true,
            message: 'Invalid configuration',
        };
        mockedAxios.post.mockRejectedValue(axiosError);

        const filePath = '/path/to/image.png';
        const options: UploadOptions = {};

        await expect(uploadToShareMyImage(filePath, options)).rejects.toThrow(ShareMyImageUploadError);

        await expect(uploadToShareMyImage(filePath, options)).rejects.toMatchObject({
            message: 'Request setup error: Invalid configuration',
            statusCode: 500,
        });
    });

    it('should throw ShareMyImageUploadError when a non-axios error occurs', async () => {
        // Cast fs.promises.stat to a mocked function and reject with a generic error
        const mockedStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
        const genericError = new Error('Filesystem error');
        mockedStat.mockRejectedValue(genericError);

        const filePath = '/path/to/image.png';
        const options: UploadOptions = {};

        await expect(uploadToShareMyImage(filePath, options)).rejects.toThrow(ShareMyImageUploadError);

        await expect(uploadToShareMyImage(filePath, options)).rejects.toMatchObject({
            message: 'Upload error: Filesystem error',
            statusCode: 500,
        });
    });

    it('should throw ShareMyImageUploadError when an unknown error type occurs', async () => {
        // Cast fs.promises.stat to a mocked function and reject with an unknown error type
        const mockedStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
        mockedStat.mockRejectedValue('Unknown error');

        const filePath = '/path/to/image.png';
        const options: UploadOptions = {};

        await expect(uploadToShareMyImage(filePath, options)).rejects.toThrow(ShareMyImageUploadError);

        await expect(uploadToShareMyImage(filePath, options)).rejects.toMatchObject({
            message: 'An unknown error occurred during the file upload',
            statusCode: 500,
        });
    });

    it('should handle missing API key gracefully', async () => {
        // Remove the API key from environment variables
        process.env.SHAREMYIMAGE_API_KEY = '';

        // Cast fs.promises.stat to a mocked function
        const mockedStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
        mockedStat.mockResolvedValue({} as fs.Stats);

        // Mock fs.createReadStream
        mockedFs.createReadStream.mockReturnValue({} as fs.ReadStream);

        // Mock mime.lookup
        mockedMime.lookup.mockReturnValue('image/png');

        // Mock FormData behavior
        const mockFormDataInstance = new MockedFormData();
        MockedFormData.mockImplementation(() => mockFormDataInstance);

        // Mock axios.post to resolve with a successful response
        const mockResponse: ShareMyImageResponse = {
            status_code: 200,
            status_txt: 'OK',
            // ...other response data
        };
        mockedAxios.post.mockResolvedValue({ data: mockResponse });

        const filePath = '/path/to/image.png';
        const options: UploadOptions = {};

        const response = await uploadToShareMyImage(filePath, options);

        // Assertions
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://www.sharemyimage.com/api/1/upload',
            mockFormDataInstance,
            {
                headers: {
                    ...mockFormDataInstance.getHeaders(),
                    'X-API-Key': '',
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            }
        );

        expect(response).toEqual(mockResponse);
    });

    it('should default to "application/octet-stream" when MIME type is not found', async () => {
        // Cast fs.promises.stat to a mocked function
        const mockedStat = fs.promises.stat as jest.MockedFunction<typeof fs.promises.stat>;
        mockedStat.mockResolvedValue({} as fs.Stats);

        // Mock fs.createReadStream
        mockedFs.createReadStream.mockReturnValue({} as fs.ReadStream);

        // Mock mime.lookup to return false
        mockedMime.lookup.mockReturnValue(false);

        // Mock FormData behavior
        const mockFormDataInstance = new MockedFormData();
        MockedFormData.mockImplementation(() => mockFormDataInstance);

        // Mock axios.post to resolve with a successful response
        const mockResponse: ShareMyImageResponse = {
            status_code: 200,
            status_txt: 'OK',
            // ...other response data
        };
        mockedAxios.post.mockResolvedValue({ data: mockResponse });

        const filePath = '/path/to/image.unknown';
        const options: UploadOptions = {};

        const response = await uploadToShareMyImage(filePath, options);

        // Assertions
        expect(mockedMime.lookup).toHaveBeenCalledWith(filePath);
        expect(mockFormDataInstance.append).toHaveBeenCalledWith('source', {}, {
            filename: 'image.unknown',
            contentType: 'application/octet-stream',
        });

        expect(response).toEqual(mockResponse);
    });
});
