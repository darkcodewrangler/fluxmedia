import { UploadInput } from '@fluxmedia/core';
import { Readable } from 'stream';

/**
 * Read a Node.js Readable stream into a Buffer.
 */
export async function readStream(stream: Readable): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Convert any supported UploadInput into a Buffer.
 */
export async function fileToBuffer(file: UploadInput): Promise<Buffer> {
  if (typeof file === 'string') {
    return Buffer.from(file);
  }
  if (file instanceof Buffer) {
    return file;
  }
  if (typeof File !== 'undefined' && file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  if (file instanceof Readable) {
    return readStream(file);
  }
  throw new Error('Invalid file type');
}

/**
 * Return true when the input is a File whose MIME type indicates an image.
 */
export function isImageFile(file: UploadInput): boolean {
  if (typeof File !== 'undefined' && file instanceof File) {
    return file.type.startsWith('image/');
  }
  return false;
}

/**
 * Return true when the input is a File whose MIME type is image/svg+xml.
 */
export function isSvgFile(file: UploadInput): boolean {
  if (typeof File !== 'undefined' && file instanceof File) {
    return file.type === 'image/svg+xml';
  }
  return false;
}
