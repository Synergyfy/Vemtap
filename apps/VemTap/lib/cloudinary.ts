export async function uploadToCloudinary(fileOrBase64: string | File): Promise<string> {
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: JSON.stringify({ file: fileOrBase64 }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload image to Cloudinary');
        }

        const data = await response.json();
        return data.url;
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        throw new Error(error.message || 'An error occurred while uploading to Cloudinary');
    }
}
