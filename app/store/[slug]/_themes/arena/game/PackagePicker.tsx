"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CircleCheck, Info, Loader2, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { PLAYER_ID_KEY, PLAYER_NAME_KEY, isPlausiblePlayerId } from "@/lib/orders/account-fields";
import { useOptionalStoreTheme } from "../../../_context/StoreThemeContext";
import { storeHref } from "../../shared/store-path";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { initialPackage, type Pkg } from "../lib/arena";
import { Price, discountPercent, num, stagger } from "../ui";
import { formatPrice, st } from "@/lib/i18n/storefront";

const REMEMBER = "casho-arena-player";

/** The player ID last used for a game, kept in this browser only (a convenience). */
function rememberedPlayer(game: string): { id: string; name: string } | null {
  try {
    const all = JSON.parse(localStorage.getItem(REMEMBER) ?? "{}") as Record<string, { id: string; name: string }>;
    return all[game] ?? null;
  } catch {
    return null;
  }
}
function rememberPlayer(game: string, value: { id: string; name: string }) {
  try {
    const all = JSON.parse(localStorage.getItem(REMEMBER) ?? "{}") as Record<string, { id: string; name: string }>;
    all[game] = value;
    localStorage.setItem(REMEMBER, JSON.stringify(all));
  } catch {
    // Private mode / blocked storage: nothing to remember.
  }
}

/**
 * The game page's order flow, as in the reference app: 1. pick a package,
 * 2. the account it goes to, then one button. The package is added to the
 * cart with the player's ID on the line (lib/orders/account-fields) and the
 * shopper lands on checkout for their number and payment.
 */
export default function PackagePicker({ storeSlug, game, packages, initialId }: { storeSlug: string; game: string; packages: Pkg[]; initialId?: string | null }) {
  const router = useRouter();
  const id = useId();
  const askPlayer = useOptionalStoreTheme()?.layout.playerId !== false;
  const { add, pending } = useAddToCart(storeSlug);

  const [selectedId, setSelectedId] = useState<string | null>(() => initialPackage(packages, initialId)?.id ?? null);
  const [options, setOptions] = useState<Record<string, string>>({});
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [going, setGoing] = useState(false);
  const idField = useRef<HTMLInputElement>(null);

  // The last ID used for this game comes back. Browser storage only exists after
  // hydration, so it's read once in an effect (the server can't know it).
  useEffect(() => {
    const saved = rememberedPlayer(game);
    if (!saved) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setPlayerId((v) => v || saved.id);
    setPlayerName((v) => v || saved.name);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [game]);

  const selected = packages.find((p) => p.id === selectedId) ?? null;
  const needs = selected ? (["size", "color"] as const).filter((k) => (k === "size" ? selected.sizes : selected.colors).length > 0) : [];

  function choose(p: Pkg) {
    if (p.stock <= 0) return;
    setSelectedId(p.id);
    setOptions({});
    setError(null);
  }

  async function confirm() {
    if (!selected) return setError(st("اختار باقة الأول"));
    const missing = needs.find((k) => !options[k]);
    if (missing) return setError(missing === "size" ? st("اختار المقاس") : st("اختار اللون"));
    const pid = playerId.trim();
    if (askPlayer) {
      if (!pid) {
        setError(st("اكتب معرّف اللاعب (ID) عشان نشحن على حسابك"));
        idField.current?.focus();
        return;
      }
      if (!isPlausiblePlayerId(pid)) {
        setError(st("اكتب المعرّف زي ما هو في اللعبة: أرقام أو حروف من غير مسافات"));
        idField.current?.focus();
        return;
      }
    }
    setError(null);
    const features: Record<string, string> = { ...options };
    if (askPlayer) {
      features[PLAYER_ID_KEY] = pid;
      if (playerName.trim()) features[PLAYER_NAME_KEY] = playerName.trim();
      rememberPlayer(game, { id: pid, name: playerName.trim() });
    }
    const res = await add(selected.id, features, 1);
    if (!res.ok) return setError(res.message);
    setGoing(true);
    router.push(storeHref(storeSlug, "/checkout"));
  }

  const busy = pending || going;
  const off = selected ? discountPercent(selected.price, selected.compareAtPrice) : 0;

  return (
    <div className="an-picker">
      <section aria-labelledby={`${id}-s1`}>
        <h2 id={`${id}-s1`} className="an-step">
          <span className="an-step-n">{num(1)}</span>
          {st("اختار الباقة")}
        </h2>
        <ul className="an-pkgs">
          {packages.map((p, i) => {
            const on = p.id === selectedId;
            const out = p.stock <= 0;
            const d = discountPercent(p.price, p.compareAtPrice);
            return (
              <li key={p.id} className="contents">
                <button
                  type="button"
                  onClick={() => choose(p)}
                  disabled={out}
                  aria-pressed={on}
                  className="an-pkg an-rise"
                  style={stagger(i)}
                  data-on={on || undefined}
                >
                  {p.isFeatured && !out && <span className="an-pkg-flag">{st("الأكثر مبيعًا")}</span>}
                  {on && <CircleCheck aria-hidden className="an-pkg-check" />}
                  <span className="an-pkg-name">{p.name}</span>
                  <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                    <Price value={p.price} />
                    {d > 0 && <s className="an-was">{formatPrice(p.compareAtPrice!)}</s>}
                  </span>
                  {out && <span className="an-pkg-out">{st("نفدت")}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {selected && needs.length > 0 && (
          <div className="mt-4 space-y-3">
            {needs.map((k) => (
              <div key={k}>
                <p className="an-label">{k === "size" ? st("المقاس") : st("اللون")}</p>
                <div className="flex flex-wrap gap-2">
                  {(k === "size" ? selected.sizes : selected.colors).map((v) => (
                    <button key={v} type="button" aria-pressed={options[k] === v} onClick={() => setOptions((o) => ({ ...o, [k]: v }))} className="an-chip" data-on={options[k] === v || undefined}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {askPlayer && (
        <section aria-labelledby={`${id}-s2`} className="mt-7">
          <h2 id={`${id}-s2`} className="an-step">
            <span className="an-step-n">{num(2)}</span>
            {st("بيانات الحساب")}
          </h2>
          <div className="space-y-3.5">
            <div>
              <label htmlFor={`${id}-pid`} className="an-label">
                {st("معرّف اللاعب (ID)")}
              </label>
              <input
                ref={idField}
                id={`${id}-pid`}
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                maxLength={40}
                required
                aria-invalid={!!error && !playerId.trim()}
                placeholder={st("مثال: 1234567890")}
                className="an-field text-start"
              />
              <p className="an-hint">{st("تلاقيه في الملف الشخصي جوه اللعبة أو التطبيق.")}</p>
            </div>
            <div>
              <label htmlFor={`${id}-pname`} className="an-label">
                {st("اسم اللاعب (اختياري)")}
              </label>
              <input id={`${id}-pname`} value={playerName} onChange={(e) => setPlayerName(e.target.value)} autoComplete="off" maxLength={40} placeholder={st("عشان نتأكد إنه الحساب الصح")} className="an-field" />
            </div>
          </div>
        </section>
      )}

      <p className="an-note mt-6">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-(--an-soft)" />
        <span>{st("في الخطوة الجاية بتكتب اسمك ورقمك وتختار طريقة الدفع، والطلب بيوصل للمتجر على طول. تقدر تتابعه من «طلباتي».")}</span>
      </p>

      {error && (
        <p role="alert" className="an-error mt-4">
          {error}
        </p>
      )}

      <div className="an-confirm">
        <div className="an-confirm-in">
          <div className="min-w-0">
            <p className="text-[0.6875rem] text-(--an-muted)">{st("الإجمالي")}</p>
            {selected ? (
              <p className="flex min-w-0 items-baseline gap-1.5">
                <Price value={selected.price} size="lg" />
                {off > 0 && <s className="an-was">{formatPrice(selected.compareAtPrice!)}</s>}
                <span className="truncate text-[0.6875rem] text-(--an-muted)">· {selected.name}</span>
              </p>
            ) : (
              <p className="text-sm text-(--an-muted)">{st("اختار باقة")}</p>
            )}
          </div>
          <button type="button" onClick={confirm} disabled={busy || !selected} className={cn("an-btn an-btn--grad an-btn--lg shrink-0")}>
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4 ltr:-scale-x-100" />}
            {askPlayer ? st("تأكيد الطلب") : st("اطلب الباقة")}
          </button>
        </div>
      </div>
    </div>
  );
}
