/**
 * Cloudinary Upload Utility
 * Handles unsigned uploads to Cloudinary using the Fetch API.
 */

export async function uploadToCloudinary(fileOrBase64: string | File): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
    }

    const formData = new FormData();
    formData.append('file', fileOrBase64);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload image to Cloudinary');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        throw new Error(error.message || 'An error occurred while uploading to Cloudinary');
    }
}
