"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UpsertPlanFeatureAction } from "@/actions/admin/admin-plans.actions";
import type { Feature, PlanFeature } from "@prisma/client";

type Row = { feature: Feature; planFeature: PlanFeature | null };

export function PlanFeatureMatrix({ planId, rows }: { planId: string; rows: Row[] }) {
  const router = useRouter();
  const [state, setState] = useState(
    () =>
      new Map(
        rows.map((r) => [
          r.feature.id,
          {
            enabled: r.planFeature?.enabled ?? false,
            limitValue: r.planFeature?.limitValue ?? null,
            isUnlimited: r.planFeature?.isUnlimited ?? false,
          },
        ]),
      ),
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  function update(featureId: string, patch: Partial<{ enabled: boolean; limitValue: number | null; isUnlimited: boolean }>) {
    setState((prev) => {
      const next = new Map(prev);
      next.set(featureId, { ...next.get(featureId)!, ...patch });
      return next;
    });
  }

  async function save(featureId: string) {
    setSavingId(featureId);
    try {
      const result = await UpsertPlanFeatureAction(planId, featureId, state.get(featureId)!);
      if (result.success) {
        toast.success("تم حفظ الميزة");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>مصفوفة المميزات</CardTitle>
        <CardDescription>فعّل أو عطّل كل ميزة لهذه الباقة، وحدد الحد الأقصى إن وُجد.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الميزة</TableHead>
              <TableHead>مفعّلة</TableHead>
              <TableHead>غير محدود</TableHead>
              <TableHead>الحد الأقصى</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ feature }) => {
              const row = state.get(feature.id)!;
              return (
                <TableRow key={feature.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{feature.name}</span>
                      {!feature.isActive && <Badge variant="secondary">غير مفعّلة للعرض</Badge>}
                    </div>
                    {feature.description && (
                      <p className="mt-0.5 max-w-md text-xs text-muted-foreground">{feature.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch checked={row.enabled} onCheckedChange={(v) => update(feature.id, { enabled: v })} />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.isUnlimited}
                      disabled={!row.enabled}
                      onCheckedChange={(v) => update(feature.id, { isUnlimited: v, limitValue: v ? null : row.limitValue })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-24"
                      disabled={!row.enabled || row.isUnlimited}
                      value={row.limitValue ?? ""}
                      onChange={(e) => update(feature.id, { limitValue: e.target.value ? Number(e.target.value) : null })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => save(feature.id)} disabled={savingId === feature.id}>
                      {savingId === feature.id ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
