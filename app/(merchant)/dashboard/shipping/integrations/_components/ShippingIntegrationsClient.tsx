"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Settings2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  SaveBostaCredentialsAction,
  SaveAramexCredentialsAction,
  ToggleShippingIntegrationAction,
  RemoveShippingIntegrationAction,
} from "@/actions/shipping-integrations.actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectedEntry = {
  id: string;
  provider: string;
  isActive: boolean;
  hint: string;
};

type ConnectedMap = Record<string, ConnectedEntry | undefined>;

type Provider = "BOSTA" | "ARAMEX";

interface ProviderMeta {
  key: Provider;
  name: string;
  logo: string; // emoji / text placeholder — replace with <Image> if you have SVGs
  description: string;
  docsUrl: string;
}

// ─── Provider catalogue ───────────────────────────────────────────────────────

const PROVIDERS: ProviderMeta[] = [
  {
    key: "BOSTA",
    name: "Bosta",
    logo: "📦",
    description: "شركة شحن مصرية سريعة مع تتبع لحظي وتسليم في يومين عمل.",
    docsUrl: "https://developer.bosta.co",
  },
  {
    key: "ARAMEX",
    name: "Aramex",
    logo: "✈️",
    description: "شركة شحن دولية تغطي مصر وأكثر من 220 دولة حول العالم.",
    docsUrl: "https://www.aramex.com/developers",
  },
];

// ─── Bosta credential form ────────────────────────────────────────────────────

function BostaForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await SaveBostaCredentialsAction(fd);
      if (!res.success) { toast.error(res.message); return; }
      toast.success(res.message);
      onSuccess();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="bosta-apiKey">API Key *</Label>
        <Input
          id="bosta-apiKey"
          name="apiKey"
          type="password"
          placeholder="أدخل Bosta API Key"
          className="rounded-xl font-mono"
          autoComplete="off"
          required
        />
        <p className="text-xs text-muted-foreground">
          تجده في لوحة تحكم Bosta ← الإعدادات ← API Keys
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bosta-pickupCity">مدينة الاستلام</Label>
        <Input
          id="bosta-pickupCity"
          name="pickupCity"
          placeholder="Cairo"
          defaultValue="Cairo"
          className="rounded-xl"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={isPending}>
          إلغاء
        </Button>
        <Button type="submit" className="rounded-xl" disabled={isPending}>
          {isPending && <Loader2 className="me-1.5 size-3.5 animate-spin" />}
          حفظ الإعدادات
        </Button>
      </div>
    </form>
  );
}

// ─── Aramex credential form ───────────────────────────────────────────────────

function AramexForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await SaveAramexCredentialsAction(fd);
      if (!res.success) { toast.error(res.message); return; }
      toast.success(res.message);
      onSuccess();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="aramex-username">اسم المستخدم *</Label>
          <Input id="aramex-username" name="username" placeholder="aramex@example.com" className="rounded-xl" autoComplete="off" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aramex-password">كلمة المرور *</Label>
          <Input id="aramex-password" name="password" type="password" placeholder="••••••••" className="rounded-xl" autoComplete="off" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aramex-accountNumber">رقم الحساب *</Label>
          <Input id="aramex-accountNumber" name="accountNumber" placeholder="12345678" className="rounded-xl font-mono" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aramex-accountPin">Account PIN *</Label>
          <Input id="aramex-accountPin" name="accountPin" type="password" placeholder="••••" className="rounded-xl font-mono" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aramex-accountEntity">Account Entity *</Label>
          <Input id="aramex-accountEntity" name="accountEntity" placeholder="CAI" defaultValue="CAI" className="rounded-xl font-mono" required />
          <p className="text-xs text-muted-foreground">رمز الفرع (مثال: CAI للقاهرة)</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aramex-accountCountryCode">Country Code</Label>
          <Input id="aramex-accountCountryCode" name="accountCountryCode" placeholder="EG" defaultValue="EG" className="rounded-xl font-mono" />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={isPending}>
          إلغاء
        </Button>
        <Button type="submit" className="rounded-xl" disabled={isPending}>
          {isPending && <Loader2 className="me-1.5 size-3.5 animate-spin" />}
          حفظ الإعدادات
        </Button>
      </div>
    </form>
  );
}

// ─── Single provider card ─────────────────────────────────────────────────────

function ProviderCard({
  meta,
  entry,
  onRefresh,
}: {
  meta: ProviderMeta;
  entry: ConnectedEntry | undefined;
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isConnected = !!entry;
  const isActive = entry?.isActive ?? false;

  function handleToggle() {
    startTransition(async () => {
      const res = await ToggleShippingIntegrationAction(meta.key, !isActive);
      if (!res.success) { toast.error(res.message); return; }
      toast.success(res.message);
      onRefresh();
    });
  }

  function handleRemove() {
    if (!confirm(`هل أنت متأكد من إزالة ربط ${meta.name}؟`)) return;
    startTransition(async () => {
      const res = await RemoveShippingIntegrationAction(meta.key);
      if (!res.success) { toast.error(res.message); return; }
      toast.success(res.message);
      onRefresh();
    });
  }

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            {/* Logo + name */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                {meta.logo}
              </div>
              <div>
                <CardTitle className="text-base">{meta.name}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{meta.description}</CardDescription>
              </div>
            </div>

            {/* Status badge */}
            {isConnected ? (
              <Badge
                variant={isActive ? "default" : "secondary"}
                className="shrink-0 rounded-lg gap-1"
              >
                {isActive
                  ? <><CheckCircle2 className="size-3" /> مفعّل</>
                  : <><XCircle className="size-3" /> موقوف</>}
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 rounded-lg text-muted-foreground">
                غير مربوط
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isConnected && (
            <p className="text-xs text-muted-foreground mb-3 font-mono">
              {meta.key === "BOSTA" ? "API Key:" : "Account:"} {entry.hint}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {/* Connect / Reconfigure */}
            <Button
              variant={isConnected ? "outline" : "default"}
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Settings2 className="size-3.5" />
              {isConnected ? "تعديل الإعدادات" : "ربط الحساب"}
            </Button>

            {/* Toggle active */}
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={handleToggle}
                disabled={isPending}
              >
                {isActive
                  ? <ToggleRight className="size-3.5 text-emerald-500" />
                  : <ToggleLeft className="size-3.5 text-muted-foreground" />}
                {isActive ? "إيقاف" : "تفعيل"}
              </Button>
            )}

            {/* Remove */}
            {isConnected && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl gap-1.5 text-destructive hover:text-destructive ms-auto"
                onClick={handleRemove}
                disabled={isPending}
              >
                <Trash2 className="size-3.5" />
                إزالة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credentials dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {meta.logo} ربط حساب {meta.name}
            </DialogTitle>
            <DialogDescription>
              بياناتك مشفرة بـ AES-256 ولا تُرسل لأي طرف خارجي.{" "}
              <a
                href={meta.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                وثائق {meta.name}
              </a>
            </DialogDescription>
          </DialogHeader>

          {meta.key === "BOSTA" ? (
            <BostaForm
              onSuccess={() => { setDialogOpen(false); onRefresh(); }}
              onCancel={() => setDialogOpen(false)}
            />
          ) : (
            <AramexForm
              onSuccess={() => { setDialogOpen(false); onRefresh(); }}
              onCancel={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page client root ─────────────────────────────────────────────────────────

export default function ShippingIntegrationsClient({
  connected,
}: {
  connected: ConnectedMap;
}) {
  // After any mutation, reload the page to get fresh data from the server
  function refresh() {
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {PROVIDERS.map((meta) => (
          <ProviderCard
            key={meta.key}
            meta={meta}
            entry={connected[meta.key]}
            onRefresh={refresh}
          />
        ))}
      </div>

      {/* Info banner */}
      <Card className="rounded-xl border-dashed bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">كيف يعمل الشحن التلقائي؟</p>
          <p>بعد ربط حسابك، يمكنك إنشاء بوليصة شحن مباشرة من صفحة الطلب بنقرة واحدة. سيتم تحديث حالة الطلب إلى «تم الشحن» ورقم التتبع تلقائياً.</p>
        </CardContent>
      </Card>
    </div>
  );
}
