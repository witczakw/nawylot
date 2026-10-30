import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// `pnpm db:*` uruchamia się w packages/db; sekrety leżą w .env w katalogu głównym.
const rootEnv = '../../.env'
if (!process.env.DATABASE_URL && existsSync(rootEnv)) process.loadEnvFile(rootEnv)

const url = process.env.DATABASE_URL

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  ...(url ? { dbCredentials: { url } } : {}),
})
