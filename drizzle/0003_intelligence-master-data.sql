CREATE TYPE "public"."commodity_category" AS ENUM('metal_mineral', 'non_metal_mineral', 'energy');--> statement-breakpoint
CREATE TYPE "public"."measurement_category" AS ENUM('mass', 'currency', 'currency_per_mass', 'percentage', 'energy', 'count', 'other');--> statement-breakpoint
CREATE TABLE "commodities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"symbol" varchar(30),
	"category" "commodity_category" NOT NULL,
	"description" text,
	"specification" text,
	"default_production_unit_code" varchar(50),
	"image_url" text,
	"is_intelligence_tracked" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "measurement_units" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"symbol" varchar(30) NOT NULL,
	"category" "measurement_category" NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commodities" ADD CONSTRAINT "commodities_default_production_unit_code_measurement_units_code_fk" FOREIGN KEY ("default_production_unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "commodities_name_idx" ON "commodities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "commodities_category_idx" ON "commodities" USING btree ("category");--> statement-breakpoint
CREATE INDEX "commodities_intelligence_tracked_idx" ON "commodities" USING btree ("is_intelligence_tracked");--> statement-breakpoint
CREATE INDEX "commodities_is_active_idx" ON "commodities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "commodities_display_order_idx" ON "commodities" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "measurement_units_category_idx" ON "measurement_units" USING btree ("category");--> statement-breakpoint
CREATE INDEX "measurement_units_is_active_idx" ON "measurement_units" USING btree ("is_active");
--> statement-breakpoint
ALTER TABLE "public"."measurement_units"
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE "public"."commodities"
ENABLE ROW LEVEL SECURITY;