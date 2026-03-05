// Export types
export type {
  UploadResult,
  UploadOptions,
  UploadInput,
  TransformationOptions,
  SearchOptions,
  MediaProvider,
  ProviderFeatures,
} from './types';

// Export errors
export {
  MediaError,
  MediaErrorCode,
  createMediaError,
  PartialUploadError,
  type PartialUploadContext,
} from './errors';

// Export plugins
export {
  PluginManager,
  createPlugin,
  type FluxMediaPlugin,
  type PluginHooks,
  type UploadPhase,
} from './plugin';

// Export main class
export {
  MediaUploader,
  type MediaUploaderConfig,
  type TransactionCallbacks,
} from './media-uploader';

// Export file type utilities
export {
  getFileType,
  getFileTypeFromStream,
  isImage,
  isVideo,
  type FileTypeResult,
} from './file-type';
