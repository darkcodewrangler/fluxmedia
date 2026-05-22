import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    only: false,
  },
  sourcemap: false,
  clean: true,
  treeshake: true,
  external: ['@aws-sdk/client-s3', '@aws-sdk/lib-storage', '@fluxmedia/core'],
});
