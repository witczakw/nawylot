import type { AlertMessage } from '@nawylot/core'

// Te same wartości co enum `notification_channel` w packages/db.
export type ChannelId = 'expo' | 'telegram' | 'email' | 'webpush'

export interface UserRef {
  id: string
}

export type SendResult =
  | { status: 'sent'; receiptId: string | null }
  // Kanał włączony w preferencjach, ale użytkownik nie podał adresu (np. nie połączył Telegrama).
  | { status: 'not-linked' }

// Kanał tylko dostarcza gotową wiadomość. Quiet hours, limity i deduplikacja są w core.
export interface NotificationChannel {
  readonly id: ChannelId
  send(user: UserRef, msg: AlertMessage): Promise<SendResult>
}
