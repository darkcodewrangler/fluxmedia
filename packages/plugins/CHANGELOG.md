# @fluxmedia/plugins

## 2.0.1

### Patch Changes

- Extract shared plugin utilities into a common `utils` module; fix `File` (Web API) input handling in validation, metadata, and optimization plugins.
- Updated dependencies
  - @fluxmedia/core@2.0.1

## 1.0.1

### Patch Changes

- Update descriptions, READMEs, and documentation to reflect the new "One API" messaging strategy.
- Updated dependencies
  - @fluxmedia/core@1.0.1

## 0.1.1

### Patch Changes

- Package size optimizations: externalized vitest from testing module, disabled source maps, removed tsdown dependency. Added typed analytics events, updated repository URL.
- Updated dependencies
  - @fluxmedia/core@0.1.1

## 0.1.0

### Minor Changes

- Add plugins package with file validation, image optimization, metadata extraction, analytics, and retry plugins. Centralize file type detection utility in core package using magic bytes.

### Patch Changes

- Updated dependencies
  - @fluxmedia/core@0.1.0
