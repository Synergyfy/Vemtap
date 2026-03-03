const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

export async function uploadToCloudinary(fileOrBase64: string | File): Promise<string> {
    try {
        let fileData = fileOrBase64;

        if (fileOrBase64 instanceof File) {
            fileData = await fileToBase64(fileOrBase64);
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: JSON.stringify({ file: fileData }),
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
