CREATE TYPE "public"."data_record_type" AS ENUM('actual', 'provisional', 'projection', 'revised');--> statement-breakpoint
CREATE TABLE "commodity_production" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"year" smallint NOT NULL,
	"production_value" numeric(24, 6) NOT NULL,
	"unit_code" varchar(50) NOT NULL,
	"record_type" "data_record_type" DEFAULT 'actual' NOT NULL,
	"source_id" uuid NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_production_year_check" CHECK ("commodity_production"."year" BETWEEN 1900 AND 2100),
	CONSTRAINT "commodity_production_value_check" CHECK ("commodity_production"."production_value" >= 0)
);
--> statement-breakpoint
ALTER TABLE "commodity_production" ADD CONSTRAINT "commodity_production_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_production" ADD CONSTRAINT "commodity_production_unit_code_measurement_units_code_fk" FOREIGN KEY ("unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_production" ADD CONSTRAINT "commodity_production_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_production_unique_record_idx" ON "commodity_production" USING btree ("commodity_id","year","record_type");--> statement-breakpoint
CREATE INDEX "commodity_production_commodity_id_idx" ON "commodity_production" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "commodity_production_year_idx" ON "commodity_production" USING btree ("year");--> statement-breakpoint
CREATE INDEX "commodity_production_record_type_idx" ON "commodity_production" USING btree ("record_type");--> statement-breakpoint
CREATE INDEX "commodity_production_source_id_idx" ON "commodity_production" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "commodity_production_verification_idx" ON "commodity_production" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "commodity_production_publication_idx" ON "commodity_production" USING btree ("publication_status");
--> statement-breakpoint
ALTER TABLE "public"."commodity_production"
ENABLE ROW LEVEL SECURITY;