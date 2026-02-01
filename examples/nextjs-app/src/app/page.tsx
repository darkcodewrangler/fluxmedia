'use client';

import { useState } from 'react';
import { useMediaUpload, type UploadMode } from '@fluxmedia/react';

type ProviderType = 'cloudinary' | 's3' | 'r2';

export default function Home() {
    const [mode, setMode] = useState<UploadMode>('signed');
    const [provider, setProvider] = useState<ProviderType>('cloudinary');

    const { upload, uploading, progress, result, error, reset } = useMediaUpload({
        mode,
        signUrlEndpoint: '/api/upload/sign',
        proxyEndpoint: '/api/upload',
        // Pass provider as form data for proxy mode
        onUploadComplete: (result) => {
            console.log('Upload complete:', result);
        },
        onUploadError: (error) => {
            console.error('Upload error:', error);
        },
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // For proxy mode, we can pass provider in the options
            await upload(file, {
                folder: 'nextjs-demo',
                // Provider passed as custom metadata for proxy endpoint
            });
        } catch (err) {
            // Error is handled by onUploadError
        }
    };

    return (
        <main className="container">
            <h1>FluxMedia</h1>
            <p className="subtitle">Provider-agnostic media uploads for Next.js</p>

            {/* Provider Selection */}
            <div className="card">
                <h2>Storage Provider</h2>
                <div className="provider-tabs">
                    {(['cloudinary', 's3', 'r2'] as const).map((p) => (
                        <button
                            key={p}
                            className={`provider-tab ${provider === p ? 'active' : ''}`}
                            onClick={() => { setProvider(p); reset(); }}
                        >
                            {p === 'cloudinary' ? 'Cloudinary' : p.toUpperCase()}
                        </button>
                    ))}
                </div>
                <p className="provider-description">
                    {provider === 'cloudinary' && 'Best for image/video transformations on-the-fly.'}
                    {provider === 's3' && 'Standard AWS S3 storage for maximum compatibility.'}
                    {provider === 'r2' && 'Cloudflare R2 - S3-compatible with zero egress fees.'}
                </p>
            </div>

            {/* Upload Mode */}
            <div className="card">
                <h2>Upload Mode</h2>
                <div className="mode-tabs">
                    <button
                        className={`mode-tab ${mode === 'signed' ? 'active' : ''}`}
                        onClick={() => { setMode('signed'); reset(); }}
                    >
                        Signed URL
                    </button>
                    <button
                        className={`mode-tab ${mode === 'proxy' ? 'active' : ''}`}
                        onClick={() => { setMode('proxy'); reset(); }}
                    >
                        Proxy
                    </button>
                </div>

                <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {mode === 'signed'
                        ? 'Get a signed URL from the server, then upload directly to provider.'
                        : 'Upload through the Next.js server. Server uses plugins for logging & validation.'}
                </p>

                <div className="upload-zone">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        style={{ display: 'none' }}
                        id="file-input"
                    />
                    <label htmlFor="file-input">
                        <button
                            className="upload-button"
                            onClick={() => document.getElementById('file-input')?.click()}
                            disabled={uploading}
                        >
                            {uploading ? `Uploading... ${progress}%` : 'Select Image'}
                        </button>
                    </label>

                    {uploading && (
                        <div className="progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>

                {error && (
                    <div className="error">
                        {error.message}
                    </div>
                )}

                {result && (
                    <div className="result">
                        <strong>Upload Complete!</strong>
                        <div className="url-display">{result.url}</div>
                        <img src={result.url} alt="Uploaded" />
                    </div>
                )}
            </div>

            {/* Plugin System Info */}
            <div className="card">
                <h2>Plugin System</h2>
                <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    When using proxy mode, the server applies these plugins automatically:
                </p>
                <div className="plugin-list">
                    <div className="plugin-item">
                        <strong>Logger Plugin</strong>
                        <span>Logs all upload/delete operations for debugging</span>
                    </div>
                    <div className="plugin-item">
                        <strong>Metadata Plugin</strong>
                        <span>Adds uploadedAt timestamp and source to all uploads</span>
                    </div>
                    <div className="plugin-item">
                        <strong>Validation Plugin</strong>
                        <span>Validates file size (max 50MB)</span>
                    </div>
                </div>
            </div>

            {/* Code Example */}
            <div className="card">
                <h2>How It Works</h2>
                <pre style={{
                    background: '#0a0a0a',
                    padding: '1rem',
                    borderRadius: '8px',
                    overflow: 'auto',
                    fontSize: '0.875rem'
                }}>
                    {`// Client-side (React hooks)
import { useMediaUpload } from '@fluxmedia/react';

const { upload, uploading, progress, result } = useMediaUpload({
  mode: '${mode}',
  ${mode === 'signed' ? "signUrlEndpoint: '/api/upload/sign'" : "proxyEndpoint: '/api/upload'"}
});

await upload(file, { folder: 'my-uploads' });

// Server-side (with plugins)
import { createPlugin } from '@fluxmedia/core';

const loggerPlugin = createPlugin('logger', {
  beforeUpload: async (file, options) => {
    console.log('Starting upload...');
    return { file, options };
  },
  afterUpload: async (result) => {
    console.log('Complete:', result.url);
    return result;
  },
});

await uploader.use(loggerPlugin);`}
                </pre>
            </div>
        </main>
    );
}
