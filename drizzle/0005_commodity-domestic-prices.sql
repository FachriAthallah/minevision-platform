CREATE TYPE "public"."price_period" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom');--> statement-breakpoint
CREATE TABLE "commodity_domestic_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price_standard_id" uuid NOT NULL,
	"effective_date" date NOT NULL,
	"period" "price_period" DEFAULT 'monthly' NOT NULL,
	"period_label" varchar(100),
	"price_value" numeric(24, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"unit_code" varchar(50) NOT NULL,
	"record_type" "data_record_type" DEFAULT 'actual' NOT NULL,
	"source_id" uuid NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_domestic_prices_value_check" CHECK ("commodity_domestic_prices"."price_value" >= 0),
	CONSTRAINT "commodity_domestic_prices_currency_check" CHECK ("commodity_domestic_prices"."currency_code" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "commodity_price_standards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"methodology" text,
	"default_currency_code" varchar(3) NOT NULL,
	"default_unit_code" varchar(50) NOT NULL,
	"issuing_source_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_price_standards_code_unique" UNIQUE("code"),
	CONSTRAINT "commodity_price_standards_currency_check" CHECK ("commodity_price_standards"."default_currency_code" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
ALTER TABLE "commodity_domestic_prices" ADD CONSTRAINT "commodity_domestic_prices_price_standard_id_commodity_price_standards_id_fk" FOREIGN KEY ("price_standard_id") REFERENCES "public"."commodity_price_standards"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_domestic_prices" ADD CONSTRAINT "commodity_domestic_prices_unit_code_measurement_units_code_fk" FOREIGN KEY ("unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_domestic_prices" ADD CONSTRAINT "commodity_domestic_prices_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_price_standards" ADD CONSTRAINT "commodity_price_standards_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_price_standards" ADD CONSTRAINT "commodity_price_standards_default_unit_code_measurement_units_code_fk" FOREIGN KEY ("default_unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_price_standards" ADD CONSTRAINT "commodity_price_standards_issuing_source_id_sources_id_fk" FOREIGN KEY ("issuing_source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_domestic_prices_unique_record_idx" ON "commodity_domestic_prices" USING btree ("price_standard_id","effective_date","record_type");--> statement-breakpoint
CREATE INDEX "commodity_domestic_prices_standard_id_idx" ON "commodity_domestic_prices" USING btree ("price_standard_id");--> statement-breakpoint
CREATE INDEX "commodity_domestic_prices_effective_date_idx" ON "commodity_domestic_prices" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "commodity_domestic_prices_period_idx" ON "commodity_domestic_prices" USING btree ("period");--> statement-breakpoint
CREATE INDEX "commodity_domestic_prices_source_id_idx" ON "commodity_domestic_prices" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "commodity_domestic_prices_verification_idx" ON "commodity_domestic_prices" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "commodity_domestic_prices_publication_idx" ON "commodity_domestic_prices" USING btree ("publication_status");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_price_standards_commodity_name_idx" ON "commodity_price_standards" USING btree ("commodity_id","name");--> statement-breakpoint
CREATE INDEX "commodity_price_standards_commodity_id_idx" ON "commodity_price_standards" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "commodity_price_standards_source_id_idx" ON "commodity_price_standards" USING btree ("issuing_source_id");--> statement-breakpoint
CREATE INDEX "commodity_price_standards_is_active_idx" ON "commodity_price_standards" USING btree ("is_active");
--> statement-breakpoint
ALTER TABLE "public"."commodity_price_standards"
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE "public"."commodity_domestic_prices"
ENABLE ROW LEVEL SECURITY;