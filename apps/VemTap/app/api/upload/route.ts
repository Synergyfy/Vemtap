import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const { file } = await request.json();

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Perform signed upload using the admin SDK
        const uploadResponse = await cloudinary.uploader.upload(file, {
            folder: 'vemtap_onboarding',
            resource_type: 'auto',
        });

        return NextResponse.json({ url: uploadResponse.secure_url });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
