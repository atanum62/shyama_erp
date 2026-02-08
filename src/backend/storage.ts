import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
    url: string;
    publicId: string;
}

/**
 * Storage Service Abstraction
 * Currently using Cloudinary, but can be updated to Cloudflare R2/Images later.
 */
export const storage = {
    uploadImage: async (fileStr: string, folder: string = 'shyama_erp'): Promise<UploadResult> => {
        try {
            const result = await cloudinary.uploader.upload(fileStr, {
                folder: folder,
            });
            return {
                url: result.secure_url,
                publicId: result.public_id,
            };
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error('Upload failed');
        }
    },

    deleteImage: async (publicId: string): Promise<void> => {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Error deleting from Cloudinary:', error);
            throw new Error('Delete failed');
        }
    },
};
