import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    // Base recommended config
    js.configs.recommended,

    // TypeScript files configuration
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
            },
            globals: {
                // Node.js globals
                Buffer: 'readonly',
                File: 'readonly',
                Blob: 'readonly',
                FormData: 'readonly',
                process: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                global: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                TextEncoder: 'readonly',
                TextDecoder: 'readonly',
                AbortController: 'readonly',
                AbortSignal: 'readonly',
                fetch: 'readonly',
                Response: 'readonly',
                Request: 'readonly',
                Headers: 'readonly',
                ReadableStream: 'readonly',
                // Browser/DOM globals for React
                React: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLElement: 'readonly',
                XMLHttpRequest: 'readonly',
                window: 'readonly',
                document: 'readonly',
                Event: 'readonly',
                MouseEvent: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            // Disable base rule in favor of TS rule
            'no-unused-vars': 'off',
        },
    },

    // Prettier config (disables conflicting rules)
    eslintConfigPrettier,

    // Global ignores
    {
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            '**/coverage/**',
            '**/*.config.ts',
            '**/*.config.js',
            '**/examples/**',
            '**/docs/**',
            '**/webapp/**',
        ],
    },
];
