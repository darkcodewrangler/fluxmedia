import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    platform: 'node',
    treeshake: true,
    external: ['@aws-sdk/client-s3', '@aws-sdk/lib-storage', '@fluxmedia/core'],
});
