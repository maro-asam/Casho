import { Lock, ShoppingBag, Truck } from "lucide-react";

import { THEME_PREVIEWS } from "@/app/(merchant)/(builder)/builder/_components/theme-previews";
import { WhatsAppIcon } from "@/app/store/[slug]/_components/conversion/WhatsAppButton";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/app/store/[slug]/_themes/shared/social";
import type { ThemePresetId } from "@/constants/store-themes";
import { cn } from "@/lib/utils";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const nf = lazyIntl.number();

export type PreviewState = {
  storeName: string;
  slug: string;
  logo: string | null;
  theme: ThemePresetId;
  contact: { whatsapp: boolean; instagram: boolean; facebook: boolean; tiktok: boolean };
  payments: string[];
  /** EGP; 0 = free. */
  shipping: number;
};

/**
 * The store as it takes shape — lives in the dark showcase next to the steps
 * and fills in with every choice the merchant makes.
 */
export function StorePreview({ state, caption }: { state: PreviewState; caption: string }) {
  const Theme = THEME_PREVIEWS[state.theme];
  const name = state.storeName.trim() || tr("متجرك");
  const socials = [
    { on: state.contact.whatsapp, Icon: WhatsAppIcon, tone: "bg-[#25d366]" },
    { on: state.contact.instagram, Icon: InstagramIcon, tone: "bg-linear-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af]" },
    { on: state.contact.facebook, Icon: FacebookIcon, tone: "bg-[#1877f2]" },
    { on: state.contact.tiktok, Icon: TikTokIcon, tone: "bg-[#111] ring-1 ring-white/15" },
  ];

  return (
    <div className="space-y-6">
      <div className="apple-card overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,.6)] ring-[0.5px] ring-white/10">
        <div className="flex items-center gap-3 bg-[#2c2c2e] px-4 py-2.5" dir="ltr">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex min-w-0 items-center gap-1.5 rounded-[8px] bg-[#1c1c1e] px-3 py-1 text-[12px] text-muted-foreground">
            <Lock className="size-3 shrink-0" />
            <span className="truncate">
              <span className="font-semibold text-foreground">{state.slug || "your-store"}</span>.casho.store
            </span>
          </div>
          <div className="w-10" />
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {state.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- merchant's uploaded logo, any host
                <img src={state.logo} alt="" className="size-11 shrink-0 rounded-[12px] bg-white object-contain p-1" />
              ) : (
                <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-linear-to-b from-primary/80 to-primary text-lg font-bold text-primary-foreground">
                  {name.charAt(0)}
                </span>
              )}
              <p className="truncate text-[17px] font-semibold">{name}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[12px] text-foreground/80">
              <ShoppingBag className="size-3.5" /> {tr("السلة")}
            </span>
          </div>

          <div
            key={state.theme}
            className="pointer-events-none overflow-hidden rounded-[14px] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.98] motion-safe:duration-500 [&>div]:rounded-[14px] [&>div]:border-0"
          >
            <Theme />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {socials.map(({ on, Icon, tone }, i) => (
                <span
                  key={i}
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-white transition-[opacity,transform] duration-300 ease-(--ease-apple)",
                    on ? cn(tone, "scale-100 opacity-100") : "scale-90 bg-white/10 opacity-40",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Truck className="size-3.5" />
              {state.shipping > 0 ? tr("شحن {0} ج.م", nf.format(state.shipping)) : tr("شحن مجاني")}
            </span>
          </div>

          {state.payments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {state.payments.map((p) => (
                <span key={p} className="rounded-full bg-white/8 px-2.5 py-1 text-[12px] text-foreground/80 motion-safe:animate-in motion-safe:fade-in">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p key={caption} className="text-center text-[15px] leading-6 text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        {caption}
      </p>
    </div>
  );
}
