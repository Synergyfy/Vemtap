const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

export async function uploadToCloudinary(fileOrBase64: string | File | Blob): Promise<string> {
    try {
        let fileData: string | File | Blob = fileOrBase64;

        if (fileOrBase64 instanceof Blob) {
            fileData = await fileToBase64(fileOrBase64 as File);
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: JSON.stringify({ file: fileData }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn('Cloudinary upload failed, falling back to base64 encoding.');
            return fileData as string;
        }

        const data = await response.json();
        return data.url || (fileData as string);
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        console.warn('Falling back to base64 encoding due to upload error.');
        // If fileData is somehow not resolved to base64 string, we do it here
        if (fileOrBase64 instanceof Blob) {
            return await fileToBase64(fileOrBase64 as File);
        }
        return fileOrBase64 as string;
    }
}
