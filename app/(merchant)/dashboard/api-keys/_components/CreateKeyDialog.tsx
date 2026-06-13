"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { createApiKey } from "@/actions/api-keys/manage.actions";
import { SCOPES, type ApiScope } from "@/lib/api/types";

const SCOPE_LABELS: Record<ApiScope, string> = {
  "orders:read": "قراءة الطلبات",
  "orders:write": "إنشاء وتعديل الطلبات",
  "customers:read": "قراءة العملاء",
  "customers:write": "إنشاء وتعديل العملاء",
  "products:read": "قراءة المنتجات",
  "shipments:read": "قراءة الشحنات",
  "shipments:write": "إنشاء وإلغاء الشحنات",
  "webhooks:read": "قراءة Webhooks",
  "webhooks:write": "إنشاء وحذف Webhooks",
};

const SCOPE_GROUPS = [
  { label: "الطلبات", scopes: ["orders:read", "orders:write"] as ApiScope[] },
  { label: "العملاء", scopes: ["customers:read", "customers:write"] as ApiScope[] },
  { label: "المنتجات", scopes: ["products:read"] as ApiScope[] },
  { label: "الشحن", scopes: ["shipments:read", "shipments:write"] as ApiScope[] },
  { label: "Webhooks", scopes: ["webhooks:read", "webhooks:write"] as ApiScope[] },
];

interface Props {
  open: boolean;
  storeId: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (
    rawKey: string,
    name: string,
    keyRecord: {
      id: string;
      name: string;
      keyHint: string;
      status: string;
      scopes: string[];
      ipWhitelist: string[];
      lastUsedAt: null;
      expiresAt: null;
      createdAt: Date;
      revokedAt: null;
    },
  ) => void;
}

export default function CreateKeyDialog({ open, storeId, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [allScopes, setAllScopes] = useState(true);
  const [selectedScopes, setSelectedScopes] = useState<Set<ApiScope>>(new Set());
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleScope(scope: ApiScope) {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      next.has(scope) ? next.delete(scope) : next.add(scope);
      return next;
    });
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("الرجاء إدخال اسم للمفتاح");
      return;
    }

    const scopes = allScopes ? [] : (Array.from(selectedScopes) as ApiScope[]);
    const ips = ipWhitelist
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        const { key, id } = await createApiKey(storeId, name.trim(), scopes, ips);

        const keyRecord = {
          id,
          name: name.trim(),
          keyHint: key.slice(-8),
          status: "ACTIVE",
          scopes,
          ipWhitelist: ips,
          lastUsedAt: null as null,
          expiresAt: null as null,
          createdAt: new Date(),
          revokedAt: null as null,
        };

        onCreated(key, name.trim(), keyRecord);

        // Reset form
        setName("");
        setAllScopes(true);
        setSelectedScopes(new Set());
        setIpWhitelist("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "حدث خطأ");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء مفتاح API جديد</DialogTitle>
          <DialogDescription>
            سيتم عرض المفتاح مرة واحدة فقط بعد الإنشاء — احتفظ به في مكان آمن.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="key-name">اسم المفتاح</Label>
            <Input
              id="key-name"
              placeholder="مثال: نظام ERP الخارجي"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Scopes */}
          <div className="space-y-3">
            <Label>الصلاحيات</Label>

            <div className="flex items-center gap-2">
              <Checkbox
                id="all-scopes"
                checked={allScopes}
                onCheckedChange={(v) => setAllScopes(!!v)}
                disabled={isPending}
              />
              <label htmlFor="all-scopes" className="cursor-pointer text-sm font-medium">
                كل الصلاحيات (غير موصى به للإنتاج)
              </label>
            </div>

            {!allScopes && (
              <div className="rounded-xl border p-3 space-y-3">
                {SCOPE_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="space-y-1.5">
                      {group.scopes.map((scope) => (
                        <div key={scope} className="flex items-center gap-2">
                          <Checkbox
                            id={scope}
                            checked={selectedScopes.has(scope)}
                            onCheckedChange={() => toggleScope(scope)}
                            disabled={isPending}
                          />
                          <label
                            htmlFor={scope}
                            className="cursor-pointer text-sm text-muted-foreground"
                          >
                            {SCOPE_LABELS[scope]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* IP Whitelist */}
          <div className="space-y-1.5">
            <Label htmlFor="ip-list">قائمة IPs المسموح بها (اختياري)</Label>
            <Input
              id="ip-list"
              placeholder="192.168.1.1, 10.0.0.1"
              value={ipWhitelist}
              onChange={(e) => setIpWhitelist(e.target.value)}
              disabled={isPending}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              افصل بين العناوين بفاصلة. اتركه فارغاً للسماح لجميع العناوين.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2 sm:gap-0">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            إنشاء المفتاح
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
