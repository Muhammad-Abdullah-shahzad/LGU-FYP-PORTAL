import { google } from 'googleapis';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});

/**
 * Uploads a file to Google Drive
 * @param {Object} fileObject - Multer file object
 * @param {string} folderId - Optional Google Drive folder ID
 * @returns {Promise<Object>} - Uploaded file metadata
 */
export const uploadFile = async (fileObject, folderId = null) => {
    try {
        const fileMetadata = {
            name: `${Date.now()}-${fileObject.originalname}`,
            parents: folderId ? [folderId] : []
        };

        const media = {
            mimeType: fileObject.mimetype,
            body: Readable.from(fileObject.buffer)
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink, webContentLink'
        });

        // Make the file publicly accessible (optional, but usually needed for viewing)
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        throw error;
    }
};

/**
 * Deletes a file from Google Drive
 * @param {string} fileId - Google Drive file ID
 */
export const deleteFile = async (fileId) => {
    try {
        await drive.files.delete({ fileId });
    } catch (error) {
        console.error('Error deleting from Google Drive:', error);
        throw error;
    }
};

export default drive;
