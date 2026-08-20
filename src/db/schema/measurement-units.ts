import { boolean, index, pgTable, text, varchar } from "drizzle-orm/pg-core";

import { createTimestampColumns, measurementCategoryEnum } from "./common";

export const measurementUnits = pgTable(
  "measurement_units",
  {
    code: varchar("code", {
      length: 50,
    }).primaryKey(),

    name: varchar("name", {
      length: 120,
    }).notNull(),

    symbol: varchar("symbol", {
      length: 30,
    }).notNull(),

    category: measurementCategoryEnum("category").notNull(),

    description: text("description"),

    isActive: boolean("is_active").default(true).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    index("measurement_units_category_idx").on(table.category),

    index("measurement_units_is_active_idx").on(table.isActive),
  ],
);

export type MeasurementUnit = typeof measurementUnits.$inferSelect;

export type NewMeasurementUnit = typeof measurementUnits.$inferInsert;
