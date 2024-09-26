// a-safe/packages/api/routes/uploadRoutes.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import fs from 'fs';
import util from 'util';
import { pipeline } from 'stream';
import { uploadToShareMyImage } from '../services/upload';
import { UploadOptions } from '../services/types';

const pump = util.promisify(pipeline);

export default async function uploadRoutes(fastify: FastifyInstance) {
    fastify.post('/upload', async function (request: FastifyRequest, reply: FastifyReply) {
        console.log('Upload route hit');
        console.log('Headers:', request.headers);

        const parts = request.parts();
        let data: MultipartFile | undefined;
        let options: Partial<UploadOptions> = {};

        for await (const part of parts) {
            if (part.type === 'file') {
                data = part;
            } else if (part.type === 'field') {
                // Collect options from form fields
                options[part.fieldname as keyof UploadOptions] = part.value;
            }
        }

        if (!data) {
            console.log('No file uploaded');
            throw new Error('No file uploaded');
        }

        console.log('Received file:', data.filename, data.mimetype);
        const filepath = `./uploads/${data.filename}`;

        try {
            await pump(data.file, fs.createWriteStream(filepath));
            console.log('Calling uploadToShareMyImage with filepath:', filepath);
            const response = await uploadToShareMyImage(filepath, options as UploadOptions);
            console.log('Upload response received:', JSON.stringify(response, null, 2));
            console.log('Deleting local file');
            fs.unlinkSync(filepath);
            console.log('Local file deleted');
            console.log('Sending success response to client');
            return reply.send({
                message: 'File uploaded and processed successfully',
                data: response,
            });
        } catch (error) {
            console.error('Error during uploadToShareMyImage:', error);
            if (fs.existsSync(filepath)) {
                console.log('Deleting local file after error');
                fs.unlinkSync(filepath);
            }
            throw error; // This will be caught by error handler
        }
    });
}