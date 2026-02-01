import { NextRequest, NextResponse } from 'next/server';
import { createUploader, type ProviderType } from '@/lib/uploaders';

/**
 * API route for proxy uploads.
 * Supports multiple providers: cloudinary, s3, r2
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string | null;
        const provider = (formData.get('provider') as ProviderType) || 'cloudinary';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Create uploader for the specified provider (with plugins enabled)
        const uploader = await createUploader(provider, true);

        // Convert File to Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload with plugins (logger will log, metadata will be enriched)
        const result = await uploader.upload(buffer, {
            folder: folder ?? undefined,
            filename: file.name.replace(/\.[^/.]+$/, ''),
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        );
    }
}

// Configure to allow larger file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};
