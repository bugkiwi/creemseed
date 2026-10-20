CREATE TABLE "payment_holds" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"subscription_id" text,
	"environment" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_holds_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "payment_holds" ADD CONSTRAINT "payment_holds_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_hold_subscription_idx" ON "payment_holds" USING btree ("subscription_id","environment");