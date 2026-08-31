CREATE INDEX "industry_company_production_source_report_idx" ON "industry_company_production" USING btree ("source_report_id");--> statement-breakpoint
CREATE INDEX "industry_company_production_unit_idx" ON "industry_company_production" USING btree ("unit_code");--> statement-breakpoint
CREATE INDEX "industry_company_financials_source_report_idx" ON "industry_company_financials" USING btree ("source_report_id");--> statement-breakpoint
CREATE INDEX "industry_operation_sites_source_report_idx" ON "industry_operation_sites" USING btree ("source_report_id");