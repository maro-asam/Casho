import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { LeadAccessError } from "@/lib/leads/access";
import type { LeadActionResult } from "@/lib/leads/service";

/** Zod issues → the first message per field, like the other admin actions. */
export function invalid(error: { issues: { path: PropertyKey[]; message: string }[] }): LeadActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { success: false, message: Object.values(fieldErrors)[0] ?? "راجع البيانات", fieldErrors };
}

/** Runs an action body: refusals and unexpected errors become a plain message — nothing internal leaks. */
export async function guarded(run: () => Promise<LeadActionResult>): Promise<LeadActionResult> {
  try {
    const result = await run();
    if (result.success) {
      revalidatePath("/admin/leads", "layout");
      revalidatePath("/sales/leads", "layout");
    }
    return result;
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof LeadAccessError) return { success: false, message: "مش مسموح لك تعمل ده" };
    console.error("[leads] action failed", error);
    return { success: false, message: "حصلت مشكلة — جرّب تاني" };
  }
}
