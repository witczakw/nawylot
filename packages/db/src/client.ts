import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import * as schema from './schema'

export function createDb(connectionString: string) {
  return drizzle(connectionString, { schema })
}

export type Db = ReturnType<typeof createDb>

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url))

export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder })
}
