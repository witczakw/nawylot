type Level = 'debug' | 'info' | 'warn' | 'error'
type Fields = Record<string, unknown>

export type Logger = Record<Level, (msg: string, fields?: Fields) => void>

function serialize(value: unknown): unknown {
  if (value instanceof Error)
    return { name: value.name, message: value.message, stack: value.stack }
  return value
}

// Jedna linia JSON na wpis — czytelne dla Railway/Fly i dla `jq`.
export function createLogger(
  write: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
): Logger {
  const at =
    (level: Level) =>
    (msg: string, fields: Fields = {}) => {
      const entry: Fields = { time: new Date().toISOString(), level, msg }
      for (const [key, value] of Object.entries(fields)) {
        if (!(key in entry)) entry[key] = serialize(value)
      }
      write(JSON.stringify(entry))
    }
  return { debug: at('debug'), info: at('info'), warn: at('warn'), error: at('error') }
}
