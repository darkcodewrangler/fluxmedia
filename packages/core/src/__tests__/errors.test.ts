import { describe, it, expect } from 'vitest';
import { MediaError, MediaErrorCode, createMediaError } from '../errors';

describe('MediaError', () => {
    it('should create an error with all properties', () => {
        const error = new MediaError(
            'Upload failed',
            MediaErrorCode.UPLOAD_FAILED,
            'cloudinary',
            new Error('Original error'),
            { fileSize: '10MB' }
        );

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(MediaError);
        expect(error.message).toBe('Upload failed');
        expect(error.code).toBe(MediaErrorCode.UPLOAD_FAILED);
        expect(error.provider).toBe('cloudinary');
        expect(error.originalError).toBeInstanceOf(Error);
        expect(error.details).toEqual({ fileSize: '10MB' });
        expect(error.name).toBe('MediaError');
    });

    it('should work without optional parameters', () => {
        const error = new MediaError(
            'Simple error',
            MediaErrorCode.NETWORK_ERROR,
            's3'
        );

        expect(error.message).toBe('Simple error');
        expect(error.code).toBe(MediaErrorCode.NETWORK_ERROR);
        expect(error.provider).toBe('s3');
        expect(error.originalError).toBeUndefined();
        expect(error.details).toBeUndefined();
    });

    it('should have proper stack trace', () => {
        const error = new MediaError(
            'Test error',
            MediaErrorCode.PROVIDER_ERROR,
            'test'
        );

        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('MediaError');
    });
});

describe('createMediaError', () => {
    it('should create MediaError from Error instance', () => {
        const originalError = new Error('Something went wrong');
        const mediaError = createMediaError(
            MediaErrorCode.UPLOAD_FAILED,
            'cloudinary',
            originalError
        );

        expect(mediaError).toBeInstanceOf(MediaError);
        expect(mediaError.message).toBe('Something went wrong');
        expect(mediaError.code).toBe(MediaErrorCode.UPLOAD_FAILED);
        expect(mediaError.provider).toBe('cloudinary');
        expect(mediaError.originalError).toBe(originalError);
    });

    it('should handle non-Error objects', () => {
        const mediaError = createMediaError(
            MediaErrorCode.NETWORK_ERROR,
            's3',
            'String error'
        );

        expect(mediaError.message).toBe('An unknown error occurred');
        expect(mediaError.originalError).toBe('String error');
    });

    it('should include additional details', () => {
        const mediaError = createMediaError(
            MediaErrorCode.FILE_TOO_LARGE,
            'r2',
            new Error('File too big'),
            { maxSize: 100, actualSize: 150 }
        );

        expect(mediaError.details).toEqual({ maxSize: 100, actualSize: 150 });
    });

    it('should handle undefined/null errors', () => {
        const mediaError = createMediaError(
            MediaErrorCode.PROVIDER_ERROR,
            'test',
            null
        );

        expect(mediaError.message).toBe('An unknown error occurred');
    });
});

describe('MediaErrorCode', () => {
    it('should have all expected error codes', () => {
        const expectedCodes = [
            'UPLOAD_FAILED',
            'FILE_TOO_LARGE',
            'INVALID_FILE_TYPE',
            'NETWORK_ERROR',
            'INVALID_CREDENTIALS',
            'UNAUTHORIZED',
            'PROVIDER_ERROR',
            'RATE_LIMITED',
            'QUOTA_EXCEEDED',
            'INVALID_CONFIG',
            'MISSING_CREDENTIALS',
            'FILE_NOT_FOUND',
            'DELETE_FAILED',
        ];

        expectedCodes.forEach((code) => {
            expect(MediaErrorCode[code as keyof typeof MediaErrorCode]).toBe(code);
        });
    });
});
