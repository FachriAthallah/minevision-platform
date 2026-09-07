import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateCareerImport, type ValidatedCareerImport } from "./validate-career-import";
import { createCareerExpectedRows, emptyCareerRows, type CareerSnapshot } from "./career-import-model";
import type { CareerImportDatabase, CareerImportTransaction } from "./import-career";

export function careerFixture(): ValidatedCareerImport {
  const base = resolve("data/staging/career");
  const manifest = JSON.parse(readFileSync(resolve(base, "manifest.json"), "utf8"));
  const files = manifest.categoryFiles.map((entry: { filePath: string }) => ({ filePath: entry.filePath,
    input: JSON.parse(readFileSync(resolve(base, entry.filePath), "utf8")) }));
  const result = validateCareerImport(manifest, files);
  if (!result.success) throw new Error("Career staging fixture invalid");
  return result.data;
}
export function careerSnapshot(dataset?: ValidatedCareerImport): CareerSnapshot {
  return { rows: dataset ? createCareerExpectedRows(dataset) : emptyCareerRows(), schemaIssues: [], referenceIssues: [] };
}
export function memoryCareerDatabase(initial = careerSnapshot(), failBatch = Infinity) {
  let committed = structuredClone(initial);
  const writes: { table: string; count: number }[] = [];
  let transactions = 0;
  let rollbacks = 0;
  const database: CareerImportDatabase = {
    async transaction<T>(work: (tx: CareerImportTransaction) => Promise<T>) {
      transactions++;
      const pending = structuredClone(committed);
      try {
        const result = await work({
          readSnapshot: async () => structuredClone(pending),
          async writeBatch(table, rows) {
            writes.push({ table, count: rows.length });
            if (writes.length === failBatch) throw new Error("Simulated batch failure");
            for (const row of rows) {
              const index = pending.rows[table].findIndex((prior) => prior.key === row.key);
              const value = { key: row.key, values: structuredClone(row.values) };
              if (index < 0) pending.rows[table].push(value);
              else pending.rows[table][index] = value;
            }
            return rows.length;
          },
        });
        committed = pending;
        return result;
      } catch (error) { rollbacks++; throw error; }
    },
  };
  return { database, writes, snapshot: () => structuredClone(committed),
    transactions: () => transactions, rollbacks: () => rollbacks };
}
