import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  char,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// Wszystkie znaczniki czasu jako timestamptz — Postgres trzyma je w UTC.
const utc = (name: string) => timestamp(name, { withTimezone: true })

export const notificationChannel = pgEnum('notification_channel', [
  'expo',
  'telegram',
  'email',
  'webpush',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Strefa IANA, używana tylko na wyjściu (treść alertu, quiet hours).
  timezone: text('timezone').notNull().default('Europe/Warsaw'),
  createdAt: utc('created_at').notNull().defaultNow(),
})

export const notificationPrefs = pgTable(
  'notification_prefs',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: notificationChannel('channel').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    // Godziny lokalne w strefie users.timezone.
    quietHoursFrom: time('quiet_hours_from'),
    quietHoursTo: time('quiet_hours_to'),
  },
  (t) => [primaryKey({ columns: [t.userId, t.channel] })],
)

export const telegramLinks = pgTable('telegram_links', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Telegram: identyfikator czatu ma do 52 bitów znaczących, mieści się w number.
  chatId: bigint('chat_id', { mode: 'number' }).notNull(),
  linkedAt: utc('linked_at').notNull().defaultNow(),
})

export const watches = pgTable(
  'watches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Kody IATA lotnisk wylotu.
    origins: text('origins').array().notNull(),
    // Kody IATA celów; null = „dowolnie”.
    destinations: text('destinations').array(),
    dateFrom: date('date_from').notNull(),
    dateTo: date('date_to').notNull(),
    nightsMin: smallint('nights_min').notNull(),
    nightsMax: smallint('nights_max').notNull(),
    pax: smallint('pax').notNull(),
    // Budżet całkowity (lot + nocleg) na osobę, w jednostkach minor waluty.
    budgetMinor: integer('budget_minor').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    active: boolean('active').notNull().default(true),
    lastScannedAt: utc('last_scanned_at'),
    createdAt: utc('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('watches_user_id_idx').on(t.userId),
    check('watches_origins_not_empty', sql`cardinality(${t.origins}) > 0`),
    check('watches_dates_order', sql`${t.dateFrom} <= ${t.dateTo}`),
    check('watches_nights_range', sql`${t.nightsMin} >= 1 and ${t.nightsMin} <= ${t.nightsMax}`),
    check('watches_pax_positive', sql`${t.pax} >= 1`),
    check('watches_budget_positive', sql`${t.budgetMinor} > 0`),
  ],
)

export const offers = pgTable(
  'offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    watchId: uuid('watch_id')
      .notNull()
      .references(() => watches.id, { onDelete: 'cascade' }),
    flightJson: jsonb('flight_json').notNull(),
    stayJson: jsonb('stay_json').notNull(),
    // Koszt całkowity wyjazdu dla wszystkich osób z watcha.
    totalMinor: integer('total_minor').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    score: integer('score').notNull(),
    fetchedAt: utc('fetched_at').notNull(),
    // Lot i nocleg zawsze jako osobne linki do osobnych dostawców (CLAUDE.md, zasada 2).
    deepLinks: jsonb('deep_links').$type<{ flight: string; stay: string }>().notNull(),
  },
  (t) => [index('offers_watch_id_fetched_at_idx').on(t.watchId, t.fetchedAt)],
)

export const priceHistory = pgTable(
  'price_history',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    routeKey: text('route_key').notNull(),
    date: date('date').notNull(),
    priceMinor: integer('price_minor').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    fetchedAt: utc('fetched_at').notNull(),
  },
  (t) => [index('price_history_route_key_fetched_at_idx').on(t.routeKey, t.fetchedAt)],
)

export const alertsSent = pgTable(
  'alerts_sent',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    watchId: uuid('watch_id')
      .notNull()
      .references(() => watches.id, { onDelete: 'cascade' }),
    channel: notificationChannel('channel').notNull(),
    offerFingerprint: text('offer_fingerprint').notNull(),
    totalMinor: integer('total_minor').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    sentAt: utc('sent_at').notNull().defaultNow(),
    providerReceiptId: text('provider_receipt_id'),
  },
  (t) => [index('alerts_sent_watch_fingerprint_idx').on(t.watchId, t.channel, t.offerFingerprint)],
)
