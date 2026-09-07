import { CAREER_IMPORT_TABLES, type CareerImportTable } from "./career-import-model";

// Only fixed SQLSTATEs are printable. Driver messages, detail, query, parameters,
// constraint names and nested causes must never enter a diagnostic.
const POSTGRES_CODES = new Set([
  "08000", "08001", "08003", "08004", "08006", "08007", "08P01",
  "22001", "22003", "22007", "22008", "22021", "22023", "22P02",
  "23502", "23503", "23505", "23514", "23P01", "25006", "25P02",
  "40001", "40P01", "42501", "42601", "42703", "42804", "42883", "42P01", "42P10",
  "53000", "53100", "53200", "53300", "53400", "54000", "54001", "54011", "54023",
  "55000", "55P03", "57014", "57P01", "57P02", "57P03", "58000", "58030", "XX000",
]);
const FIELDS: Record<CareerImportTable, readonly string[]> = {
  sources: ["slug", "name", "type", "organization", "url", "description", "is_official", "verification_status", "is_active"],
  content_categories: ["module", "slug", "name", "description", "display_order", "is_active"],
  contents: ["module", "type", "slug", "category_id", "title", "excerpt", "body", "cover_image_url", "status",
    "published_at", "reading_time_minutes", "is_featured", "metadata"],
  content_sources: ["content_id", "source_id", "citation_label", "page_reference", "display_order"],
  career_professions: ["content_id", "group_key", "group_label", "name", "slug", "description", "display_order"],
  career_profile_items: ["content_id", "item_key", "section", "group_key", "group_label", "value", "display_order"],
};

export function careerPostgresCode(error: unknown): string | undefined {
  try {
    if (error && typeof error === "object" && "code" in error) {
      const code = error.code;
      if (typeof code === "string" && POSTGRES_CODES.has(code)) return code;
    }
  } catch { /* An untrusted accessor is not a diagnostic. */ }
  return undefined;
}

export type CareerBatchContext = {
  phase: "write_batch";
  table: CareerImportTable;
  batchIndex: number;
  totalBatches: number;
  batchRowCount: number;
};
export type CareerBatchProgress = CareerBatchContext & {
  eventId: "CAREER_BATCH_STARTED" | "CAREER_BATCH_COMPLETED";
};
export type CareerVerificationDiagnostic = {
  table: CareerImportTable;
  // Residual actions required by the post-write plan, inside the transaction.
  inserts: number;
  updates: number;
  unchanged: number;
  mismatchedFields: string[];
};
export type CareerImportDiagnostic = (
  | (CareerBatchContext & { errorId: "CAREER_BATCH_WRITE_FAILED" })
  | (CareerBatchContext & { errorId: "CAREER_BATCH_ROW_COUNT_MISMATCH";
      expectedRowCount: number; returnedRowCount: number | null })
  | { phase: "post_write_verification"; errorId: "CAREER_POST_WRITE_VERIFICATION_FAILED";
      tables: CareerVerificationDiagnostic[] }
  | { phase: "preflight"; errorId: "CAREER_PREFLIGHT_FAILED" }
  | { phase: "post_write_verification"; errorId: "CAREER_POST_WRITE_CHECK_FAILED" }
  | { phase: "transaction"; errorId: "CAREER_TRANSACTION_FAILED" }
) & { postgresCode?: string };

const diagnostics = new WeakMap<object, CareerImportDiagnostic>();
const count = (value: number) => Number.isSafeInteger(value) && value >= 0 ? value : 0;

// Project each variant explicitly, even for typed callers. Extra properties and
// mutable Error.message/cause/code properties are never serialized by the CLI.
function safeDiagnostic(input: CareerImportDiagnostic): CareerImportDiagnostic {
  const postgresCode = careerPostgresCode({ code: input.postgresCode });
  const code = postgresCode ? { postgresCode } : {};
  switch (input.errorId) {
    case "CAREER_BATCH_WRITE_FAILED":
    case "CAREER_BATCH_ROW_COUNT_MISMATCH": {
      if (!CAREER_IMPORT_TABLES.includes(input.table)) break;
      const batch: CareerBatchContext = { phase: "write_batch", table: input.table,
        batchIndex: Math.max(1, count(input.batchIndex)), totalBatches: Math.max(1, count(input.totalBatches)),
        batchRowCount: count(input.batchRowCount) };
      return input.errorId === "CAREER_BATCH_WRITE_FAILED"
        ? { ...batch, errorId: input.errorId, ...code }
        : { ...batch, errorId: input.errorId, expectedRowCount: count(input.expectedRowCount),
          returnedRowCount: typeof input.returnedRowCount === "number" &&
            Number.isSafeInteger(input.returnedRowCount) && input.returnedRowCount >= 0 ? input.returnedRowCount : null, ...code };
    }
    case "CAREER_POST_WRITE_VERIFICATION_FAILED":
      return { phase: "post_write_verification", errorId: input.errorId, ...code,
        tables: input.tables.filter((entry) => CAREER_IMPORT_TABLES.includes(entry.table)).map((entry) => ({
          table: entry.table, inserts: count(entry.inserts), updates: count(entry.updates), unchanged: count(entry.unchanged),
          mismatchedFields: [...new Set(entry.mismatchedFields.filter((field) => FIELDS[entry.table].includes(field)))].sort(),
        })) };
    case "CAREER_PREFLIGHT_FAILED":
      return { phase: "preflight", errorId: input.errorId, ...code };
    case "CAREER_POST_WRITE_CHECK_FAILED":
      return { phase: "post_write_verification", errorId: input.errorId, ...code };
    case "CAREER_TRANSACTION_FAILED":
      return { phase: "transaction", errorId: input.errorId, ...code };
  }
  return { phase: "transaction", errorId: "CAREER_TRANSACTION_FAILED" };
}

export class CareerImportExecutionError extends Error {
  constructor(diagnostic: CareerImportDiagnostic) {
    const safe = safeDiagnostic(diagnostic);
    super(safe.errorId);
    this.name = "CareerImportExecutionError";
    diagnostics.set(this, safe);
  }
}

export function getCareerImportDiagnostic(error: unknown): CareerImportDiagnostic | undefined {
  if (!error || typeof error !== "object") return undefined;
  const diagnostic = diagnostics.get(error);
  // Return a fresh projection so callers cannot mutate the stored diagnostic.
  return diagnostic ? safeDiagnostic(diagnostic) : undefined;
}
