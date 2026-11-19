import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.nx/**',
      '**/node_modules/**',
      'apps/mobile/**',
      'apps/admin/**',
      'apps/web/**',
      'prisma/seed/**',
    ],
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Nest decorators frequently need value imports (Injectable, Module, …).
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  prettier,
);
