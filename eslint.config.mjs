// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'build/',
            'scripts/',
            'src/declarations/',
            'src/tests/e2e/',
            'eslint.config.mjs',
            'rollup.config.js',
            'commitlint.config.js',
            'lint-staged-config.mjs',
            'scripts/',
            'tests/',
            'playwright.config.ts',
            'docker/',
            'playwright/',
            'playwright-report/',
            'test-results/',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        rules: {
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/triple-slash-reference': 'off',
            '@typescript-eslint/no-unsafe-enum-comparison': 'off',
            'no-unexpected-multiline': 'off',
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                allowDefaultProject: ['*.js'],
            },
        },
    },
    {
        files: ['src/tests/quench/**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
        },
    },
);
