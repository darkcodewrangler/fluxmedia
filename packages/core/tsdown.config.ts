import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts', 'src/testing.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    platform: 'node',
    treeshake: true,
    external: [
        'stream',
        'file-type',
        'load-esm',
    ],
});
