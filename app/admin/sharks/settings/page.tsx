import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { getSharksProgram } from "@/lib/sharks/program";
import { ProgramForm } from "../_components/program-form";

export default async function SharksSettingsPage() {
  await requireAdmin();
  const program = await getSharksProgram();
  return (
    <div className="max-w-2xl">
      <ProgramForm initial={program} />
    </div>
  );
}
