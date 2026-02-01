import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { filename, contentType, folder } = await request.json();

        // Validate inputs
        if (!filename || !contentType) {
            return NextResponse.json(
                { error: 'Missing filename or contentType' },
                { status: 400 }
            );
        }

        // Initialize S3 client
        const client = new S3Client({
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        // Build S3 key
        const key = folder ? `${folder}/${filename}` : filename;

        // Create PutObject command
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET!,
            Key: key,
            ContentType: contentType,
        });

        // Generate signed URL (valid for 1 hour)
        const signedUrl = await getSignedUrl(client, command, {
            expiresIn: 3600, // 1 hour in seconds
        });

        // Return signed URL and key to client
        return NextResponse.json({
            url: signedUrl,
            key: key,
            expiresIn: 3600,
        });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json(
            { error: 'Failed to generate signed URL' },
            { status: 500 }
        );
    }
}
