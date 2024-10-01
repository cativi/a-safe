// a-safe/packages/api/routes/uploadRoutes.ts

import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';
import { uploadToShareMyImage } from '../services/upload';
import { UploadOptions } from '../services/types';
import { errorHandler } from '../utils/errorHandler';

const pump = util.promisify(pipeline); // Promisify the pipeline function to use async/await
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB maximum file size

const uploadRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    console.log('Registering upload routes in Upload Routes file');

    // Check if the ShareMyImage API key is correctly set in the environment variables
    if (!process.env.SHAREMYIMAGE_API_KEY || !process.env.SHAREMYIMAGE_API_KEY.startsWith('chv_')) {
        console.error('SHAREMYIMAGE_API_KEY is not set correctly in the environment variables');
        throw new Error('SHAREMYIMAGE_API_KEY is not set correctly in the environment variables');
    }

    // Define the upload route for handling file uploads
    fastify.route<{
        Body: { [key: string]: unknown };
    }>({
        method: 'POST',
        url: '/',
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            console.log('Upload route handler started');
            console.log('User authenticated:', request.user);

            let fileData: any;
            let filepath: string | undefined;

            try {
                console.log('Processing multipart form data');
                // Parse the multipart form data from the request
                const parts = request.parts();

                console.log('Iterating through parts');
                // Iterate through the parts to find the uploaded file
                for await (const part of parts) {
                    console.log(`Processing part: ${part.type}`);
                    if (part.type === 'file') {
                        fileData = part;
                        console.log(`Received file: ${part.filename}, size: ${part.file.bytesRead} bytes`);
                        console.log('File details:', {
                            filename: part.filename,
                            encoding: part.encoding,
                            mimetype: part.mimetype,
                        });
                        break; // Exit the loop after processing the file
                    }
                    console.log(`Finished processing part: ${part.type}`);
                }
                console.log('Finished processing multipart form data');

                // If no file is uploaded, return an error response
                if (!fileData) {
                    console.error('No file uploaded');
                    return reply.status(400).send({ error: 'No file uploaded' });
                }

                console.log('Checking file size');
                // Check if the uploaded file size exceeds the maximum limit
                if (fileData.file.bytesRead > MAX_FILE_SIZE) {
                    console.error(`File size (${fileData.file.bytesRead} bytes) exceeds the maximum limit (${MAX_FILE_SIZE} bytes)`);
                    return reply.status(400).send({ error: 'File size exceeds the maximum limit' });
                }

                console.log('Preparing to save file');
                // Define the uploads directory path
                const uploadsDir = path.join(__dirname, '..', 'uploads');
                console.log(`Uploads directory: ${uploadsDir}`);
                // Create the uploads directory if it doesn't exist
                if (!fs.existsSync(uploadsDir)) {
                    console.log(`Creating uploads directory: ${uploadsDir}`);
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }

                // Define the file path where the file will be saved
                filepath = path.join(uploadsDir, `${Date.now()}-${fileData.filename}`);
                console.log(`Saving file to: ${filepath}`);
                // Save the file using a write stream
                await pump(fileData.file, fs.createWriteStream(filepath));
                console.log('File saved successfully');

                console.log('Preparing to upload file to ShareMyImage');
                console.log('File path:', filepath);

                // Define options for uploading the file to ShareMyImage
                const uploadOptions: UploadOptions = {
                    format: 'json',
                    // Add any other required parameters here
                };

                // Upload the file to ShareMyImage
                if (filepath) {
                    const response = await uploadToShareMyImage(filepath, uploadOptions);
                    console.log('Upload to ShareMyImage completed', JSON.stringify(response));

                    // Send a success response with the upload result
                    return reply.send({
                        message: 'File uploaded successfully',
                        response,
                    });
                } else {
                    throw new Error('File path is undefined');
                }
            } catch (error) {
                console.error('Error in upload route:', error);
                if (error instanceof Error) {
                    console.error('Error stack:', error.stack);

                    // Handle specific errors related to API key issues
                    if (error.message.includes('No key provided')) {
                        return reply.status(500).send({ error: 'API key configuration error. Please contact the administrator.' });
                    }
                }
                // Use a custom error handler to process the error
                return errorHandler(error instanceof Error ? error : new Error('An unknown error occurred'), request, reply);
            } finally {
                // Cleanup: Delete the temporary file after the upload process
                if (filepath && fs.existsSync(filepath)) {
                    console.log(`Cleaning up temporary file: ${filepath}`);
                    try {
                        fs.unlinkSync(filepath);
                        console.log('Temporary file cleaned up successfully');
                    } catch (cleanupError) {
                        console.error('Error cleaning up temporary file:', cleanupError);
                    }
                }
                console.log('Upload route handler completed');
            }
        },
    });
};

export default uploadRoutes;
