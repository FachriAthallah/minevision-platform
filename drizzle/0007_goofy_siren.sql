CREATE TABLE "commodity_production_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"production_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"citation_label" varchar(255) NOT NULL,
	"source_url" text,
	"page_reference" varchar(100),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commodity_production_sources" ADD CONSTRAINT "commodity_production_sources_production_id_commodity_production_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."commodity_production"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_production_sources" ADD CONSTRAINT "commodity_production_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_production_sources_unique_citation_idx" ON "commodity_production_sources" USING btree ("production_id","source_id","citation_label");--> statement-breakpoint
CREATE INDEX "commodity_production_sources_production_id_idx" ON "commodity_production_sources" USING btree ("production_id");--> statement-breakpoint
CREATE INDEX "commodity_production_sources_source_id_idx" ON "commodity_production_sources" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "commodity_production_sources_primary_idx" ON "commodity_production_sources" USING btree ("production_id","is_primary");
ALTER TABLE "commodity_production_sources"
ENABLE ROW LEVEL SECURITY;