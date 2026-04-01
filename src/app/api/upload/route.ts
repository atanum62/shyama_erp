import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    console.log("Upload request received");
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error("No file provided in form data");
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log(`File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log("Buffer created, starting Cloudinary upload stream");

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'shyama_erp/inwards',
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary callback error:', error);
                        reject(error);
                    }
                    else {
                        console.log('Cloudinary upload success');
                        resolve(result);
                    }
                }
            ).end(buffer);
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Upload Error Exception:', error);
        return NextResponse.json({ error: error.message || 'Unknown error during upload' }, { status: 500 });
    }
}
