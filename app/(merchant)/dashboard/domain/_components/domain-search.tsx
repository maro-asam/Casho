"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { buyDomainAction, searchDomainsAction, type DomainSearchResult } from "@/actions/store/domain-purchase.actions";
import { StatusText, appleButton } from "@/components/saas-page";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatMoney } from "@/lib/balance-ui/meta";
import { formatDomainPrice } from "@/lib/domains/format";
import type { DomainOffer } from "@/lib/domains/pricing";
import { cn } from "@/lib/utils";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";
import { BrowserBar } from "./browser-bar";

type ForSale = Extract<DomainOffer, { available: true }>;

/** "my-shop.store" → ["my-shop", ".store"] */
function splitDomain(domain: string) {
  const dot = domain.indexOf(".");
  return dot < 0 ? [domain, ""] : [domain.slice(0, dot), domain.slice(dot)];
}

function DomainName({ domain, className }: { domain: string; className?: string }) {
  const [label, tld] = splitDomain(domain);
  return (
    <span dir="ltr" className={cn("truncate rtl:text-right", className)}>
      <span className="font-semibold">{label}</span>
      <span className="font-normal text-muted-foreground">{tld}</span>
    </span>
  );
}

/**
 * Search names with prices in EGP and buy one from the balance. The store's
 * slug is searched on open so there's something to pick right away.
 */
export function DomainSearch({ initialQuery, balance }: { initialQuery: string; balance: number }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [result, setResult] = useState<DomainSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<ForSale | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [buying, startBuy] = useTransition();
  const lastQuery = useRef("");
  const requestId = useRef(0);

  async function search(raw: string) {
    const query = raw.trim();
    if (query.length < 2 || query === lastQuery.current) return;
    lastQuery.current = query;
    const id = ++requestId.current;
    setSearching(true);
    const res = await searchDomainsAction(query).catch(() => null);
    if (id !== requestId.current) return; // a newer search is on its way
    setSearching(false);
    setResult(res ?? { ok: false, message: tr("مقدرناش ندوّر دلوقتي. جرّب تاني.") });
  }

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || query === lastQuery.current) return;
    const t = setTimeout(() => search(query), lastQuery.current ? 600 : 0);
    return () => clearTimeout(t);
  }, [value]);

  function updateOffer(domain: string, next: DomainOffer) {
    setResult((r) => (r?.ok ? { ...r, offers: r.offers.map((o) => (o.domain === domain ? next : o)) } : r));
  }

  function open(offer: ForSale) {
    setNotice(null);
    setPicked(offer);
  }

  function buy() {
    if (!picked) return;
    const offer = picked;
    startBuy(async () => {
      const res = await buyDomainAction(offer.domain, offer.price).catch(() => null);
      if (!res) {
        toast.error(tr("حصل خطأ، جرّب تاني."));
        return;
      }
      if (res.ok) {
        setPicked(null);
        toast.success(res.status === "ACTIVE" ? tr("{0} بقى بتاعك 🎉", offer.domain) : tr("بنسجّل {0} دلوقتي…", offer.domain));
        router.refresh();
        return;
      }
      if (res.reason === "price-changed" && res.price) {
        const next = { ...offer, price: res.price };
        updateOffer(offer.domain, next);
        setPicked(next);
        setNotice(tr("السعر اتغيّر لـ {0}. راجعه وأكّد تاني.", formatDomainPrice(res.price)));
        return;
      }
      if (res.reason === "short") {
        setNotice(tr("رصيدك مش مكفي. اشحن رصيدك وارجع اشتري."));
        router.refresh();
        return;
      }
      setPicked(null);
      toast.error(trv(res.message));
      if (res.reason === "unavailable" || res.reason === "busy") updateOffer(offer.domain, { domain: offer.domain, available: false, reason: "taken" });
      router.refresh(); // a refund may have changed the balance
    });
  }

  const offers = result?.ok ? result.offers : [];
  const firstForSale = offers.find((o): o is ForSale => o.available);
  const preview = picked?.domain ?? firstForSale?.domain ?? "";
  const shortfall = picked ? picked.price - balance : 0;

  return (
    <div className="space-y-6">
      <section className="apple-card flex flex-col items-center px-6 pt-10 pb-8 text-center sm:px-10">
        <BrowserBar host={preview} placeholder="mystore.com" secure={Boolean(preview)} />
        <h2 className="mt-7 text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">{tr("دوّر على دومين لمتجرك")}</h2>
        <p className="mt-2 max-w-md text-[15px] leading-[22px] text-muted-foreground">
          {tr("الأسعار بالجنيه وبتتخصم من رصيدك — من غير كارت ولا دولار. الدومين بيتربط بمتجرك لوحده.")}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            lastQuery.current = "";
            search(value);
          }}
          className="mt-7 flex w-full max-w-md gap-2"
          role="search"
        >
          <div dir="ltr" className="flex h-[50px] min-w-0 flex-1 items-center rounded-[12px] bg-(--fill-3) ps-3.5 transition-shadow focus-within:ring-2 focus-within:ring-ring">
            <Search className="size-[18px] shrink-0 text-(--label-3)" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="mystore"
              autoComplete="off"
              spellCheck={false}
              aria-label={tr("اسم الدومين")}
              className="h-full min-w-0 flex-1 bg-transparent px-2 text-[17px] outline-none placeholder:text-(--label-3)"
            />
            <span className="grid w-10 place-items-center">{searching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}</span>
          </div>
          <button type="submit" disabled={searching || value.trim().length < 2} className={cn(appleButton.filled, "h-[50px] shrink-0 px-6 text-[17px]")}>
            {tr("دوّر")}
          </button>
        </form>
      </section>

      <section aria-live="polite" aria-busy={searching} className="space-y-2">
        {result && !result.ok && <p className="px-4 text-[13px] text-(--sys-red)">{trv(result.message)}</p>}
        {result?.ok && (
          <>
            <h3 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("الدومينات المتاحة")}</h3>
            {result.egyptian && (
              <p className="rounded-[12px] bg-(--sys-orange)/12 px-4 py-3 text-[13px] leading-[19px]">
                {tr("الدومينات المصرية (.eg / .com.eg) مش متاحة للشراء من هنا. تقدر تشتريها من جهة مصرية معتمدة وتربطها من «عندي دومين». دي البدائل المتاحة:")}
              </p>
            )}
            <ul className={cn("apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:16px] transition-opacity", searching && "opacity-60")}>
              {offers.map((offer) => (
                <li key={offer.domain} className="flex min-h-[64px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <DomainName domain={offer.domain} className={cn("block text-[17px]", !offer.available && "opacity-55")} />
                    <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">
                      {offer.available
                        ? offer.renewalPrice > offer.price
                          ? tr("السنة الأولى · التجديد بعد كده {0} في السنة", formatDomainPrice(offer.renewalPrice))
                          : tr("في السنة · نفس السعر كل سنة")
                        : offer.reason === "premium"
                          ? tr("دومين مميز — مش متاح للبيع هنا")
                          : offer.reason === "unsupported"
                            ? tr("مش متاح للبيع من هنا")
                            : tr("محجوز لحد تاني")}
                    </p>
                  </div>
                  {offer.available ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[17px] font-semibold tabular-nums">{formatDomainPrice(offer.price)}</span>
                      <button type="button" onClick={() => open(offer)} className={cn(appleButton.filled, "h-9 px-4")}>
                        {tr("اشتري")}
                      </button>
                    </div>
                  ) : (
                    <StatusText tone="neutral">{tr("مش متاح")}</StatusText>
                  )}
                </li>
              ))}
            </ul>
            <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">
              {tr("السعر لسنة كاملة. الدومين بيتجدد كل سنة من رصيدك قبل ما يخلص بشهر، وتقدر تقفل التجديد في أي وقت.")}
            </p>
          </>
        )}
      </section>

      <AlertDialog open={Boolean(picked)} onOpenChange={(o) => !buying && !o && setPicked(null)}>
        <AlertDialogContent dir={tdir()} className="max-w-[22rem] gap-0 p-0">
          {picked && (
            <>
              <AlertDialogHeader className="items-center gap-1 px-5 pt-6 pb-4 text-center sm:text-center">
                <AlertDialogTitle className="text-[17px] font-semibold">{tr("تشتري {0}؟", picked.domain)}</AlertDialogTitle>
                <AlertDialogDescription className="text-[13px] leading-[18px]">
                  {tr("بيتسجّل لمتجرك لمدة سنة ويتربط بيه لوحده — من غير أي إعدادات DNS.")}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <dl className="mx-4 mb-3 apple-rows overflow-hidden rounded-[12px] bg-(--fill-3)/60 text-[15px] [--row-inset:14px]">
                {[
                  [tr("السنة الأولى"), formatDomainPrice(picked.price), "font-semibold"],
                  [tr("التجديد كل سنة"), formatDomainPrice(picked.renewalPrice), ""],
                  [tr("رصيدك دلوقتي"), formatMoney(balance), ""],
                  [tr("رصيدك بعد الشراء"), shortfall > 0 ? tr("ناقصك {0}", formatMoney(shortfall)) : formatMoney(balance - picked.price), shortfall > 0 ? "font-semibold text-(--sys-red)" : ""],
                ].map(([label, amount, cls]) => (
                  <div key={label} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className={cn("tabular-nums", cls)}>{amount}</dd>
                  </div>
                ))}
              </dl>

              {notice && <p className="mx-4 mb-3 rounded-[10px] bg-(--sys-orange)/12 px-3 py-2 text-[13px] leading-[18px]">{notice}</p>}
              <p className="px-5 pb-4 text-center text-[12px] leading-[17px] text-muted-foreground">
                {tr("ثمن التسجيل مش بيترجع بعد ما الدومين يتسجّل. لو التسجيل ماكملش لأي سبب، المبلغ بيرجع لرصيدك لوحده.")}
              </p>

              <AlertDialogFooter className="grid grid-cols-2 gap-0 border-t border-border/60 sm:space-x-0">
                <AlertDialogCancel
                  disabled={buying}
                  className="m-0 h-11 rounded-none border-0 bg-transparent text-[17px] text-primary shadow-none hover:bg-(--fill-3)/60"
                >
                  {tr("رجوع")}
                </AlertDialogCancel>
                {shortfall > 0 ? (
                  <Link
                    href={`/balance/topup?amount=${Math.ceil(shortfall / 100)}`}
                    className="grid h-11 place-items-center border-s border-border/60 text-[17px] font-semibold text-primary hover:bg-(--fill-3)/60"
                  >
                    {tr("اشحن رصيدك")}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={buy}
                    disabled={buying}
                    className="inline-flex h-11 items-center justify-center gap-1.5 border-s border-border/60 text-[17px] font-semibold text-primary hover:bg-(--fill-3)/60 disabled:opacity-60"
                  >
                    {buying && <Loader2 className="size-4 animate-spin" />}
                    {buying ? tr("بنسجّل…") : tr("اشتري")}
                  </button>
                )}
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
