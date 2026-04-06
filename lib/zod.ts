import { z } from "zod";

export function getFieldErrors<T extends Record<string, unknown>>(
  error: z.ZodError<T>,
) {
  const fieldErrors: Partial<Record<keyof T, string>> = {};

  for (const issue of error.issues) {
    const path = issue.path[0] as keyof T | undefined;
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}
