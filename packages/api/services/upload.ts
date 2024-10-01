// a-safe/packages/api/services/upload.ts

import axios, { AxiosError } from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { ShareMyImageUploadError } from '../utils/errorHandler';
import { UploadOptions, ShareMyImageResponse } from './types';
import { authenticateUser } from './authService';

const API_URL = 'https://www.sharemyimage.com/api/1/upload/';
const UPLOAD_TIMEOUT = 120000; // 2 minutes timeout for upload requests

// Function to log in as an admin user to obtain a JWT token for authentication
async function loginAsAdmin(): Promise<string> {
    console.log('Logging in as admin...');
    try {
        const email = process.env.ADMIN_EMAIL || '';
        const password = process.env.ADMIN_PASSWORD || '';

        // Authenticate the admin user using the authService
        const { token, message } = await authenticateUser(email, password);

        if (token) {
            console.log('Successfully logged in as admin.');
            return token;
        } else {
            console.error('Failed to login as admin:', message);
            throw new Error(message);
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        throw new Error('Failed to login as admin');
    }
}

// Function to upload a file to ShareMyImage using the ShareMyImage API
async function uploadToShareMyImage(
    filePath: string,
    options: UploadOptions
): Promise<ShareMyImageResponse> {
    console.log('Starting uploadToShareMyImage function');
    const apiKey = process.env.SHAREMYIMAGE_API_KEY;
    if (!apiKey || !apiKey.startsWith('chv_')) {
        console.error('SHAREMYIMAGE_API_KEY is not set correctly in the environment variables');
        throw new Error('SHAREMYIMAGE_API_KEY is not set correctly in the environment variables');
    }
    console.log('API Key (first 10 characters):', apiKey.substring(0, 10));

    let fileStream: fs.ReadStream | null = null;
    try {
        console.log('Retrieving admin token for authentication...');
        const token = await loginAsAdmin(); // Get the admin JWT token

        // Check if the file exists at the provided file path
        console.log(`Checking if file exists: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            console.error(`File does not exist: ${filePath}`);
            throw new Error(`File does not exist: ${filePath}`);
        }

        // Create a read stream for the file to be uploaded
        console.log(`Creating read stream for file: ${filePath}`);
        fileStream = fs.createReadStream(filePath);

        // Create FormData for the file upload
        console.log('Creating FormData');
        const formData = new FormData();
        formData.append('source', fileStream); // Add the file to the form data
        formData.append('key', apiKey); // Add the API key to the form data

        // Add optional parameters to the FormData
        console.log('Adding optional parameters to FormData');
        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value.toString());
                console.log(`Added option: ${key} = ${value}`);
            }
        });

        // Prepare to send a POST request to the ShareMyImage API
        console.log('Preparing to send POST request to ShareMyImage API');
        console.log(`API URL: ${API_URL}`);
        console.log('Request headers:', formData.getHeaders());

        console.log('Sending POST request to ShareMyImage API');
        const url = new URL(API_URL);
        url.searchParams.append('key', apiKey); // Add API key to URL parameters

        // Send the POST request with the file and other data
        const response = await axios.post<ShareMyImageResponse>(url.toString(), formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`, // Use the admin JWT token for authentication
                'Content-Type': 'multipart/form-data',
            },
            timeout: UPLOAD_TIMEOUT,
            onUploadProgress: (progressEvent) => {
                // Log the upload progress
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
                console.log(`Upload progress: ${percentCompleted}%`);
            },
        });

        // Check if the response indicates a successful upload
        console.log('Received response from ShareMyImage API', JSON.stringify(response.data, null, 2));
        if (response.data.status_code !== 200) {
            console.error(`Upload failed: ${response.data.status_txt}`);
            throw new ShareMyImageUploadError(
                `Upload failed: ${response.data.status_txt}`,
                response.data.status_code
            );
        }

        console.log('Upload to ShareMyImage successful');
        return response.data;
    } catch (error) {
        // Handle errors during the upload process
        console.error('Error in uploadToShareMyImage:', error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers,
            });
            if (error.code === 'ECONNABORTED') {
                console.error('Upload request timed out');
            }
            if (error.response?.data.error && error.response.data.error.code === 100) {
                console.error('API key was not recognized by ShareMyImage. Please check the key validity.');
                throw new ShareMyImageUploadError('API key was not recognized. Please check the key validity.', error.response?.status || 500);
            }
        }
        throw error;
    } finally {
        // Ensure that the file stream is closed after the upload attempt
        if (fileStream) {
            console.log('Closing file stream');
            fileStream.close();
        }
        console.log('uploadToShareMyImage function completed');
    }
}

export { uploadToShareMyImage, loginAsAdmin };
