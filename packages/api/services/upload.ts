// a-safe/packages/api/services/upload.ts

import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import mime from 'mime-types';
import { ShareMyImageUploadError, FileUploadError } from '../utils/errorHandler';
import { UploadOptions, ShareMyImageResponse } from './types';

export async function uploadToShareMyImage(filePath: string, options: UploadOptions): Promise<ShareMyImageResponse> {

    const formData = new FormData();
    try {
        const stats = await fs.promises.stat(filePath);
        const fileStream = fs.createReadStream(filePath);

        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
        formData.append('source', fileStream, {
            filename: filePath.split('/').pop(),
            contentType: mimeType,
        });

        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value.toString());
            }
        });

        const apiKey = process.env.SHAREMYIMAGE_API_KEY || '';
        const maskedApiKey = apiKey.slice(0, 4) + '****' + apiKey.slice(-4);

        const response = await axios.post<ShareMyImageResponse>(
            'https://www.sharemyimage.com/api/1/upload',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'X-API-Key': apiKey,
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            }
        );

        if (response.data.status_code !== 200) {
            throw new ShareMyImageUploadError(`Upload failed: ${response.data.status_txt}`, response.data.status_code);
        }

        return response.data;
    } catch (error) {

        if (error instanceof ShareMyImageUploadError) {
            throw error;
        }
        if (axios.isAxiosError(error)) {
            if (error.response) {
                throw new ShareMyImageUploadError(`Upload error: ${error.response.data?.error?.message || error.message}`, error.response.status);
            } else if (error.request) {
                throw new ShareMyImageUploadError('No response received from ShareMyImage', 500);
            } else {
                throw new ShareMyImageUploadError(`Request setup error: ${error.message}`, 500);
            }
        }
        // Handle unknown error types
        if (typeof error === 'string') {
            throw new ShareMyImageUploadError('An unknown error occurred during the file upload', 500);
        } else if (error instanceof Error) {
            throw new ShareMyImageUploadError(`Upload error: ${error.message}`, 500);
        } else {
            throw new ShareMyImageUploadError('An unexpected error occurred during the file upload', 500);
        }
    }
}