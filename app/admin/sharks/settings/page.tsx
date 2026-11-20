import { requireAdminPage } from "@/lib/admin/page-guard";
import { getSharksProgram } from "@/lib/sharks/program";
import { ProgramForm } from "../_components/program-form";

export default async function SharksSettingsPage() {
  await requireAdminPage();
  const program = await getSharksProgram();
  return (
    <div className="max-w-2xl">
      <ProgramForm initial={program} />
    </div>
  );
}
