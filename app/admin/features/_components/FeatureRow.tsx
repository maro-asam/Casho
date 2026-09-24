"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { UpdateFeatureAction } from "@/actions/admin/admin-plans.actions";
import type { Feature } from "@prisma/client";

export function FeatureRow({ feature }: { feature: Feature }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: feature.name,
    description: feature.description,
    unit: feature.unit,
    isActive: feature.isActive,
    sortOrder: feature.sortOrder,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const result = await UpdateFeatureAction(feature.id, form);
      if (result.success) {
        toast.success("تم الحفظ");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">{feature.key}</TableCell>
      <TableCell>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="min-w-40" />
      </TableCell>
      <TableCell>
        <Input
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value || null })}
          className="min-w-64"
        />
      </TableCell>
      <TableCell>
        <Input
          value={form.unit ?? ""}
          onChange={(e) => setForm({ ...form, unit: e.target.value || null })}
          className="w-20"
        />
      </TableCell>
      <TableCell>
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          className="w-16"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
        />
      </TableCell>
      <TableCell>
        <Button size="sm" variant="ghost" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
        </Button>
      </TableCell>
    </TableRow>
  );
}
