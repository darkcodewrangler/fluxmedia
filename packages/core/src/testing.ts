import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { MediaProvider, UploadResult } from './types';

/**
 * Mock result factory for testing
 */
export function createMockUploadResult(overrides?: Partial<UploadResult>): UploadResult {
  return {
    id: 'test-id',
    storageKey: 'test-id',
    url: 'https://example.com/test.jpg',
    publicUrl: 'https://example.com/test.jpg',
    size: 1024,
    format: 'jpg',
    provider: 'mock',
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock provider for testing
 */
export function createMockProvider(overrides?: Partial<MediaProvider>): MediaProvider {
  const mockResult = createMockUploadResult();

  return {
    name: 'mock',
    features: {
      transformations: {
        resize: true,
        crop: true,
        format: true,
        quality: true,
        blur: false,
        rotate: false,
        effects: false,
      },
      capabilities: {
        signedUploads: true,
        directUpload: true,
        multipartUpload: false,
        videoProcessing: false,
        aiTagging: false,
        facialDetection: false,
      },
      storage: {
        maxFileSize: 10 * 1024 * 1024,
        supportedFormats: ['jpg', 'png', 'gif', 'webp'],
      },
    },
    upload: vi.fn().mockResolvedValue(mockResult),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(mockResult),
    getUrl: vi.fn().mockReturnValue('https://example.com/test.jpg'),
    uploadMultiple: vi.fn().mockResolvedValue([mockResult]),
    deleteMultiple: vi.fn().mockResolvedValue(undefined),
    get native() {
      return null;
    },
    ...overrides,
  };
}

/**
 * Contract test factory for MediaProvider implementations.
 * Run these tests against any provider to ensure it correctly implements the interface.
 *
 * @example
 * ```ts
 * import { createProviderContractTests } from '@fluxmedia/core/testing';
 * import { CloudinaryProvider } from '@fluxmedia/cloudinary';
 *
 * createProviderContractTests('Cloudinary', () =>
 *   new CloudinaryProvider({ cloudName: 'test', apiKey: 'test', apiSecret: 'test' })
 * );
 * ```
 */
export function createProviderContractTests(
  providerName: string,
  createProvider: () => MediaProvider
): void {
  describe(`${providerName} Provider Contract`, () => {
    let provider: MediaProvider;

    beforeEach(() => {
      provider = createProvider();
    });

    describe('Required Properties', () => {
      it('should have a name property', () => {
        expect(provider.name).toBeDefined();
        expect(typeof provider.name).toBe('string');
        expect(provider.name.length).toBeGreaterThan(0);
      });

      it('should have a features property', () => {
        expect(provider.features).toBeDefined();
        expect(typeof provider.features).toBe('object');
      });
    });

    describe('Feature Matrix Structure', () => {
      it('should have transformations feature group', () => {
        expect(provider.features.transformations).toBeDefined();
        expect(typeof provider.features.transformations).toBe('object');
      });

      it('should have all transformation properties as booleans', () => {
        const { transformations } = provider.features;
        expect(typeof transformations.resize).toBe('boolean');
        expect(typeof transformations.crop).toBe('boolean');
        expect(typeof transformations.format).toBe('boolean');
        expect(typeof transformations.quality).toBe('boolean');
      });

      it('should have capabilities feature group', () => {
        expect(provider.features.capabilities).toBeDefined();
        expect(typeof provider.features.capabilities).toBe('object');
      });

      it('should have storage feature group', () => {
        expect(provider.features.storage).toBeDefined();
        expect(typeof provider.features.storage).toBe('object');
        expect(typeof provider.features.storage.maxFileSize).toBe('number');
        expect(Array.isArray(provider.features.storage.supportedFormats)).toBe(true);
      });
    });

    describe('Required Methods', () => {
      it('should have upload method', () => {
        expect(typeof provider.upload).toBe('function');
      });

      it('should have delete method', () => {
        expect(typeof provider.delete).toBe('function');
      });

      it('should have get method', () => {
        expect(typeof provider.get).toBe('function');
      });

      it('should have getUrl method', () => {
        expect(typeof provider.getUrl).toBe('function');
      });

      it('should have uploadMultiple method', () => {
        expect(typeof provider.uploadMultiple).toBe('function');
      });

      it('should have deleteMultiple method', () => {
        expect(typeof provider.deleteMultiple).toBe('function');
      });

      it('should have native getter', () => {
        expect('native' in provider).toBe(true);
      });
    });

    describe('getUrl Method', () => {
      it('should return a string for any id', () => {
        const url = provider.getUrl('test-id');
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
      });

      it('should return a URL-like string', () => {
        const url = provider.getUrl('test-id');
        expect(url).toMatch(/^(https?:\/\/|\/)/);
      });

      it('should handle transformation options', () => {
        const url = provider.getUrl('test-id', { width: 100, height: 100 });
        expect(typeof url).toBe('string');
      });
    });
  });
}
