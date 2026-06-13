"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Plus,
  MoreHorizontal,
  ShieldOff,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  Code2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { revokeApiKey, rotateApiKey } from "@/actions/api-keys/manage.actions";
import CreateKeyDialog from "./CreateKeyDialog";
import KeyRevealDialog from "./KeyRevealDialog";

type ApiKey = {
  id: string;
  name: string;
  keyHint: string;
  status: string;
  scopes: string[];
  ipWhitelist: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
};

interface Props {
  storeId: string;
  initialKeys: ApiKey[];
}

export default function ApiKeysClient({ storeId, initialKeys }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleKeyCreated(rawKey: string, name: string, keyRecord: ApiKey) {
    setKeys((prev) => [keyRecord, ...prev]);
    setNewKey({ key: rawKey, name });
    setCreateOpen(false);
  }

  function handleRevoke() {
    if (!revokeTarget) return;
    const id = revokeTarget.id;
    setRevokeTarget(null);

    startTransition(async () => {
      try {
        await revokeApiKey(id, storeId);
        setKeys((prev) =>
          prev.map((k) =>
            k.id === id ? { ...k, status: "REVOKED", revokedAt: new Date() } : k,
          ),
        );
        toast.success("تم إلغاء المفتاح بنجاح");
      } catch {
        toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
      }
    });
  }

  function handleRotate(key: ApiKey) {
    startTransition(async () => {
      try {
        const { key: rawKey, id: newId } = await rotateApiKey(key.id, storeId);
        setKeys((prev) =>
          prev
            .map((k) => (k.id === key.id ? { ...k, status: "REVOKED", revokedAt: new Date() } : k))
            .concat([
              {
                ...key,
                id: newId,
                status: "ACTIVE",
                revokedAt: null,
                lastUsedAt: null,
                createdAt: new Date(),
              },
            ]),
        );
        setNewKey({ key: rawKey, name: `${key.name} (جديد)` });
        toast.success("تم تجديد المفتاح بنجاح");
      } catch {
        toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
      }
    });
  }

  const activeKeys = keys.filter((k) => k.status === "ACTIVE");
  const revokedKeys = keys.filter((k) => k.status === "REVOKED");

  return (
    <>
      {/* Info + create button */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base">المفاتيح النشطة</CardTitle>
            <CardDescription className="mt-1">
              استخدم مفتاح API للاتصال بنظام Casho برمجياً من أنظمتك الخارجية
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={() => setCreateOpen(true)}
            disabled={activeKeys.length >= 10}
          >
            <Plus className="size-4" />
            مفتاح جديد
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Endpoint hint */}
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
            <Code2 className="size-3.5 shrink-0" />
            <span dir="ltr">Authorization: Bearer csk_live_••••••••</span>
          </div>

          {activeKeys.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <Code2 className="size-8 text-muted-foreground/40" />
              <p>لا توجد مفاتيح نشطة</p>
              <p className="text-xs">أنشئ مفتاحاً للبدء في استخدام API</p>
            </div>
          ) : (
            <div className="divide-y rounded-xl border">
              {activeKeys.map((key) => (
                <KeyRow
                  key={key.id}
                  apiKey={key}
                  onRevoke={() => setRevokeTarget(key)}
                  onRotate={() => handleRotate(key)}
                  disabled={isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoked keys (collapsed) */}
      {revokedKeys.length > 0 && (
        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المفاتيح الملغاة ({revokedKeys.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-xl border">
              {revokedKeys.map((key) => (
                <KeyRow key={key.id} apiKey={key} revoked />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateKeyDialog
        open={createOpen}
        storeId={storeId}
        onOpenChange={setCreateOpen}
        onCreated={handleKeyCreated}
      />

      <KeyRevealDialog
        open={!!newKey}
        rawKey={newKey?.key ?? ""}
        name={newKey?.name ?? ""}
        onClose={() => setNewKey(null)}
      />

      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء المفتاح</AlertDialogTitle>
            <AlertDialogDescription>
              سيتوقف المفتاح <strong>{revokeTarget?.name}</strong> عن العمل فوراً. هذا الإجراء لا
              يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRevoke}
            >
              إلغاء المفتاح
            </AlertDialogAction>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Key row ──────────────────────────────────────────────────────────────────

function KeyRow({
  apiKey,
  onRevoke,
  onRotate,
  disabled,
  revoked,
}: {
  apiKey: ApiKey;
  onRevoke?: () => void;
  onRotate?: () => void;
  disabled?: boolean;
  revoked?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{apiKey.name}</span>
          {apiKey.status === "ACTIVE" ? (
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
          ) : (
            <ShieldOff className="size-3.5 shrink-0 text-muted-foreground" />
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-xs text-muted-foreground" dir="ltr">
            csk_live_••••{apiKey.keyHint}
          </span>

          {apiKey.scopes.length === 0 ? (
            <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-xs">
              كل الصلاحيات
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {apiKey.scopes.length} صلاحية
            </span>
          )}

          {apiKey.lastUsedAt ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              آخر استخدام{" "}
              {formatDistanceToNow(apiKey.lastUsedAt, { addSuffix: true, locale: ar })}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60">لم يُستخدم بعد</span>
          )}
        </div>
      </div>

      {!revoked && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" disabled={disabled}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onRotate}>
              <RefreshCw className="me-2 size-4" />
              تجديد المفتاح
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onRevoke}
            >
              <ShieldOff className="me-2 size-4" />
              إلغاء المفتاح
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
