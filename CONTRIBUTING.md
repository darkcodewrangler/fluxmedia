# Contributing to FluxMedia

Thank you for your interest in contributing to FluxMedia! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/fluxmedia.git
cd fluxmedia
```

2. Install dependencies:
```bash
pnpm install
```

3. Build all packages:
```bash
pnpm build
```

4. Run tests:
```bash
pnpm test
```

## Development Workflow

### Project Structure

```
fluxmedia/
├── packages/         # Core packages
│   ├── core/         # Core types and abstractions
│   ├── cloudinary/   # Cloudinary provider
│   ├── s3/           # AWS S3 provider
│   ├── r2/           # Cloudflare R2 provider
│   └── react/        # React integration
├── examples/         # Example applications
└── docs/             # Documentation
```

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/my-new-feature
```

2. Make your changes

3. Run tests:
```bash
pnpm test
```

4. Run linting:
```bash
pnpm lint
```

5. Build packages:
```bash
pnpm build
```

6. Create a changeset (for package changes):
```bash
pnpm changeset
```

Follow the prompts to describe your changes.

### Code Style

- We use **ESLint** and **Prettier** for code formatting
- Run `pnpm format` to automatically format code
- All public APIs must have **JSDoc comments**
- Use **TypeScript strict mode** - no `any` types

### Testing

- Write tests for all new features
- Maintain >80% code coverage
- Run `pnpm test:coverage` to check coverage

#### Test Types

1. **Unit tests** - Mock dependencies, test individual functions
2. **Integration tests** - Test with real provider APIs (optional, requires credentials)
3. **Contract tests** - Ensure all providers implement the interface correctly

### Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Create a changeset for package changes
5. Submit PR with clear description

PR Checklist:
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Changeset created (if applicable)
- [ ] Code reviewed

## Adding a New Provider

1. Create a new package in `packages/`:
```bash
mkdir -p packages/my-provider/src
```

2. Implement the `MediaProvider` interface:
```typescript
import type { MediaProvider } from '@fluxmedia/core';

export class MyProvider implements MediaProvider {
  readonly name = 'my-provider';
  readonly features = MyProviderFeatures;
  
  async upload(file, options) {
    // Implementation
  }
  
  // ... other required methods
}
```

3. Add tests

4. Update documentation

5. Submit PR

## Commit Convention

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `chore:` - Build/tooling changes

Examples:
```
feat(cloudinary): add video upload support
fix(core): handle upload progress correctly
docs(readme): update installation instructions
```

## Questions?

- Open an issue for **bugs** or **feature requests**
- Start a discussion for **questions** or **ideas**
- Check existing issues before creating new ones

## Code of Conduct

Be respectful and inclusive. We're all here to build something great together.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
