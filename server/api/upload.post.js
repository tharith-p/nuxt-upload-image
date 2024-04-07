import { readFiles } from "h3-formidable";
import { errors as formidableErrors } from "formidable";
import fs from "fs";
import got from 'got';
import FormData from 'form-data'

export default defineEventHandler(async (event) => {
    const maxFiles = 1;
    const fileSize = 1024 * 1024 * 5; // 5MB

    try {
        const { files } = await readFiles(event, {
            maxFiles: maxFiles,
            maxFileSize: fileSize,
        });

        if (!Object.keys(files).length) {
            throw createError({
                statusMessage: "2001",
                statusCode: 400,
            });
        }

        const destinationServer = 'http://127.0.0.1:9100/api/v1/temp/upload/image'
        const formData          = new FormData()
        const file              = files['file'][0]

        formData.append('user_id', '8d4938e1-f6fa-455b-bc4d-12bc1065205e'); 
        formData.append('is_photo_id', '0')
        formData.append('file', fs.createReadStream(file.filepath), file.originalFilename)
        try {
            const response = await got.post(destinationServer, {
            body: formData
            , headers: formData.getHeaders()
            });

            return { message: 'File uploaded successfully' };

        } catch(error) {
            console.log('error', error)
            return {
                status: 400,
                message: error.message
            }
        }
        
    } catch (error) {
        console.log('e', error)
        if (error.message === "2001") {
            throw createError({
                statusMessage: "File is required.",
                statusCode: 400,
            });
        }

        if (error.message === "2002") {
            throw createError({
                statusMessage: "Only image allowed.",
                statusCode: 400,
            });
        }

        if (error.code === formidableErrors.maxFilesExceeded) {
            throw createError({
                statusMessage: `Can't upload more than ${maxFiles} image.`,
                statusCode: 400,
            });
        }

        if (error.code === formidableErrors.biggerThanTotalMaxFileSize) {
            throw createError({
                statusMessage: `File is larger than ${(fileSize / (1024 * 1024))} MB.`,
                statusCode: 400,
            });
        }

        throw createError({
            statusMessage: "An unknown error occurred",
            statusCode: 500
        });
    }
});
