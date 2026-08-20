import {
  intelligenceImportBundleSchema,
  type IntelligenceImportBundle,
} from "../schemas/intelligence-import";

export type IntelligenceValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type IntelligenceValidationResult =
  | {
      success: true;
      data: IntelligenceImportBundle;
      issues: [];
    }
  | {
      success: false;
      data: null;
      issues: IntelligenceValidationIssue[];
    };

export function validateIntelligenceImport(
  input: unknown,
): IntelligenceValidationResult {
  const validationResult = intelligenceImportBundleSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      data: null,
      issues: validationResult.error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join(".") : "root",
        code: issue.code,
        message: issue.message,
      })),
    };
  }

  return {
    success: true,
    data: validationResult.data,
    issues: [],
  };
}
