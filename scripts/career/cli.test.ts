import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { runCareerCli } from "./cli";
import { loadValidatedCareerImport } from "./load-career-import";
import * as importer from "../../src/features/data-ingestion/services/import-career";
import { CareerImportExecutionError } from "../../src/features/data-ingestion/services/career-import-diagnostics";
import { careerFixture } from "../../src/features/data-ingestion/services/career-import-test-helpers";

vi.mock("postgres", () => ({ default: vi.fn() }));
vi.mock("dotenv", () => ({ config: vi.fn() }));
vi.mock("./load-career-import", () => ({ loadValidatedCareerImport: vi.fn() }));
vi.mock("./writer", () => ({ createPostgresCareerDatabase: vi.fn() }));

describe("Career CLI diagnostic output (no database)", () => {
  const originalExitCode = process.exitCode;
  const end = vi.fn(async () => {});
  beforeEach(() => {
    process.exitCode = 0;
    vi.stubEnv("DATABASE_MIGRATION_URL", "postgres://test-user:test-password@database.invalid/db");
    vi.mocked(loadValidatedCareerImport).mockResolvedValue(careerFixture());
    vi.mocked(postgres).mockReturnValue({ end } as unknown as ReturnType<typeof postgres>);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => { process.exitCode = originalExitCode; vi.unstubAllEnvs(); });

  it("prints known batch diagnostics and exits 1 with connection cleanup", async () => {
    vi.spyOn(importer, "executeCareerImport").mockRejectedValue(new CareerImportExecutionError({
      phase: "write_batch", table: "career_professions", batchIndex: 2, totalBatches: 9,
      batchRowCount: 300, errorId: "CAREER_BATCH_WRITE_FAILED", postgresCode: "23503",
    }));
    await runCareerCli("import", ["manifest.json", "--commit"]);
    expect(console.error).toHaveBeenCalledExactlyOnceWith(JSON.stringify({
      mode: "import", outcome: "failed", commitConfirmed: false, diagnostic: {
        phase: "write_batch", table: "career_professions", batchIndex: 2, totalBatches: 9,
        batchRowCount: 300, errorId: "CAREER_BATCH_WRITE_FAILED", postgresCode: "23503",
      },
    }));
    expect(console.log).not.toHaveBeenCalled(); expect(process.exitCode).toBe(1);
    expect(end).toHaveBeenCalledExactlyOnceWith({ timeout: 5 });
  });

  it("prints only safe verification fields from a known error", async () => {
    vi.spyOn(importer, "executeCareerImport").mockRejectedValue(new CareerImportExecutionError({
      phase: "post_write_verification", errorId: "CAREER_POST_WRITE_VERIFICATION_FAILED",
      tables: [{ table: "contents", inserts: 0, updates: 2, unchanged: 11, mismatchedFields: ["title", "title"] }],
    }));
    await runCareerCli("import", ["manifest.json", "--commit"]);
    expect(console.error).toHaveBeenCalledExactlyOnceWith(JSON.stringify({
      mode: "import", outcome: "failed", commitConfirmed: false, diagnostic: {
        phase: "post_write_verification", errorId: "CAREER_POST_WRITE_VERIFICATION_FAILED",
        tables: [{ table: "contents", inserts: 0, updates: 2, unchanged: 11, mismatchedFields: ["title"] }],
      },
    }));
    expect(process.exitCode).toBe(1);
  });

  it("redacts unknown messages, credentials, source URLs, SQL and parameters", async () => {
    const secret = `${process.env.DATABASE_MIGRATION_URL} https://source.invalid/private INSERT INTO private VALUES ($1) secret-slug`;
    vi.spyOn(importer, "executeCareerImport").mockRejectedValue(Object.assign(new Error(secret), {
      code: "SECRET_PASSWORD", query: secret, parameters: [secret], detail: secret,
    }));
    await runCareerCli("import", ["manifest.json", "--commit"]);
    expect(console.error).toHaveBeenCalledExactlyOnceWith(JSON.stringify({
      mode: "import", outcome: "failed", commitConfirmed: false, diagnostic: { errorId: "CAREER_DATABASE_FAILED" },
    }));
    expect(console.log).not.toHaveBeenCalled(); expect(process.exitCode).toBe(1);
  });

  it("redacts connection construction failures before executing the importer", async () => {
    vi.mocked(postgres).mockImplementationOnce(() => { throw new Error("postgres://private.invalid INSERT private"); });
    const execute = vi.spyOn(importer, "executeCareerImport");
    await runCareerCli("import", ["manifest.json", "--commit"]);
    expect(console.error).toHaveBeenCalledExactlyOnceWith(JSON.stringify({
      mode: "import", outcome: "failed", commitConfirmed: false, diagnostic: { errorId: "CAREER_DATABASE_FAILED" },
    }));
    expect(execute).not.toHaveBeenCalled(); expect(process.exitCode).toBe(1);
  });

  it("still refuses import without --commit before loading staging or connecting", async () => {
    const execute = vi.spyOn(importer, "executeCareerImport");
    await runCareerCli("import", ["manifest.json"]);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("data:dry-run:career"));
    expect(loadValidatedCareerImport).not.toHaveBeenCalled(); expect(postgres).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled(); expect(process.exitCode).toBe(1);
  });
});
