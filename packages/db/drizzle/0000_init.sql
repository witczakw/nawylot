CREATE TYPE "public"."notification_channel" AS ENUM('expo', 'telegram', 'email', 'webpush');--> statement-breakpoint
CREATE TABLE "alerts_sent" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "alerts_sent_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"watch_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"offer_fingerprint" text NOT NULL,
	"total_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider_receipt_id" text
);
--> statement-breakpoint
CREATE TABLE "notification_prefs" (
	"user_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours_from" time,
	"quiet_hours_to" time,
	CONSTRAINT "notification_prefs_user_id_channel_pk" PRIMARY KEY("user_id","channel")
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"watch_id" uuid NOT NULL,
	"flight_json" jsonb NOT NULL,
	"stay_json" jsonb NOT NULL,
	"total_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"score" integer NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"deep_links" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "price_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"route_key" text NOT NULL,
	"date" date NOT NULL,
	"price_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_links" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"chat_id" bigint NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timezone" text DEFAULT 'Europe/Warsaw' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"origins" text[] NOT NULL,
	"destinations" text[],
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"nights_min" smallint NOT NULL,
	"nights_max" smallint NOT NULL,
	"pax" smallint NOT NULL,
	"budget_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_scanned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watches_origins_not_empty" CHECK (cardinality("watches"."origins") > 0),
	CONSTRAINT "watches_dates_order" CHECK ("watches"."date_from" <= "watches"."date_to"),
	CONSTRAINT "watches_nights_range" CHECK ("watches"."nights_min" >= 1 and "watches"."nights_min" <= "watches"."nights_max"),
	CONSTRAINT "watches_pax_positive" CHECK ("watches"."pax" >= 1),
	CONSTRAINT "watches_budget_positive" CHECK ("watches"."budget_minor" > 0)
);
--> statement-breakpoint
ALTER TABLE "alerts_sent" ADD CONSTRAINT "alerts_sent_watch_id_watches_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."watches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_watch_id_watches_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."watches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_links" ADD CONSTRAINT "telegram_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watches" ADD CONSTRAINT "watches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_sent_watch_fingerprint_idx" ON "alerts_sent" USING btree ("watch_id","channel","offer_fingerprint");--> statement-breakpoint
CREATE INDEX "offers_watch_id_fetched_at_idx" ON "offers" USING btree ("watch_id","fetched_at");--> statement-breakpoint
CREATE INDEX "price_history_route_key_fetched_at_idx" ON "price_history" USING btree ("route_key","fetched_at");--> statement-breakpoint
CREATE INDEX "watches_user_id_idx" ON "watches" USING btree ("user_id");