CREATE TYPE "public"."region_level" AS ENUM('country', 'province', 'regency', 'city');--> statement-breakpoint
CREATE TABLE "commodity_production_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	"year" smallint NOT NULL,
	"production_value" numeric(24, 6),
	"unit_code" varchar(50),
	"share_percentage" numeric(7, 4),
	"producer_rank" smallint,
	"record_type" "data_record_type" DEFAULT 'actual' NOT NULL,
	"source_id" uuid NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_production_locations_year_check" CHECK ("commodity_production_locations"."year" BETWEEN 1900 AND 2100),
	CONSTRAINT "commodity_production_locations_value_check" CHECK (
          "commodity_production_locations"."production_value" IS NULL
          OR "commodity_production_locations"."production_value" >= 0
        ),
	CONSTRAINT "commodity_production_locations_share_check" CHECK (
          "commodity_production_locations"."share_percentage" IS NULL
          OR (
            "commodity_production_locations"."share_percentage" >= 0
            AND "commodity_production_locations"."share_percentage" <= 100
          )
        ),
	CONSTRAINT "commodity_production_locations_rank_check" CHECK (
          "commodity_production_locations"."producer_rank" IS NULL
          OR "commodity_production_locations"."producer_rank" > 0
        ),
	CONSTRAINT "commodity_production_locations_unit_check" CHECK (
          "commodity_production_locations"."production_value" IS NULL
          OR "commodity_production_locations"."unit_code" IS NOT NULL
        ),
	CONSTRAINT "commodity_production_locations_data_check" CHECK (
          "commodity_production_locations"."production_value" IS NOT NULL
          OR "commodity_production_locations"."producer_rank" IS NOT NULL
          OR "commodity_production_locations"."share_percentage" IS NOT NULL
        )
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"code" varchar(30),
	"name" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"level" "region_level" NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regions_latitude_check" CHECK (
        "regions"."latitude" IS NULL
        OR (
          "regions"."latitude" >= -90
          AND "regions"."latitude" <= 90
        )
      ),
	CONSTRAINT "regions_longitude_check" CHECK (
        "regions"."longitude" IS NULL
        OR (
          "regions"."longitude" >= -180
          AND "regions"."longitude" <= 180
        )
      )
);
--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "commodity_production_locations_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "commodity_production_locations_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "commodity_production_locations_unit_code_measurement_units_code_fk" FOREIGN KEY ("unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "commodity_production_locations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_parent_id_regions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_production_locations_unique_idx" ON "commodity_production_locations" USING btree ("commodity_id","region_id","year","record_type");--> statement-breakpoint
CREATE INDEX "commodity_production_locations_commodity_idx" ON "commodity_production_locations" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "commodity_production_locations_region_idx" ON "commodity_production_locations" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "commodity_production_locations_year_idx" ON "commodity_production_locations" USING btree ("year");--> statement-breakpoint
CREATE INDEX "commodity_production_locations_source_idx" ON "commodity_production_locations" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "commodity_production_locations_verification_idx" ON "commodity_production_locations" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "commodity_production_locations_publication_idx" ON "commodity_production_locations" USING btree ("publication_status");--> statement-breakpoint
CREATE UNIQUE INDEX "regions_slug_unique_idx" ON "regions" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "regions_code_unique_idx" ON "regions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "regions_parent_id_idx" ON "regions" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "regions_level_idx" ON "regions" USING btree ("level");--> statement-breakpoint
CREATE INDEX "regions_name_idx" ON "regions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "regions_is_active_idx" ON "regions" USING btree ("is_active");
--> statement-breakpoint
ALTER TABLE "public"."regions"
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE "public"."commodity_production_locations"
ENABLE ROW LEVEL SECURITY;