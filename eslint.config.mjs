import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: ['**/node_modules/', '**/dist/', '**/.next/', '**/coverage/', 'packages/db/drizzle/'],
  },
  js.configs.recommended,
  tseslint.configs.strict,
  {
    rules: {
      'no-console': 'error',
    },
  },
)
