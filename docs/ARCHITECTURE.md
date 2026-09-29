# Architektura

```
[web: Next.js + route handlers] ──> [Postgres] <── [worker: pg-boss]                                          │
                                                           ├─ scan-watch(watchId)
                                                           │    providers.flights → top-N → providers.stays
                                                           │    core.totalCost → core.scoreDeal → offers
                                                           └─ notify(offerId)
                                                                notifications.dispatch(user, offer)
                                                                  ├─ TelegramChannel
                                                                  └─ (EmailChannel, WebPushChannel)
```

## Tabele (szkic)
- `users`
- `notification_prefs` (user_id, channel, enabled, quiet_hours_from, quiet_hours_to)
- `telegram_links` (user_id, chat_id, linked_at)
- `watches` (id, user_id, origins[], destinations[] | null, date_from, date_to,
  nights_min, nights_max, pax, budget_minor, currency, active, last_scanned_at)
- `offers` (id, watch_id, flight_json, stay_json, total_minor, score, fetched_at, deep_links)
- `price_history` (route_key, date, price_minor, fetched_at)
- `alerts_sent` (watch_id, channel, offer_fingerprint, total_minor, sent_at, provider_receipt_id)

## Powiadomienia
```ts
interface NotificationChannel {
  id: 'expo' | 'telegram' | 'email' | 'webpush'
  send(user: UserRef, msg: AlertMessage): Promise<SendResult>
}
```
- `AlertMessage`: tytuł, treść (≤ ~120 znaków na push), `offerId`, `deepLink`, cena + data pobrania.
- Quiet hours i limit alertów/dzień na użytkownika — w `core`, nie w kanale.
