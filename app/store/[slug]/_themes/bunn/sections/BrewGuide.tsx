"use client";

import Link from "next/link";
import { useState } from "react";
import { Droplets, Gauge, Minus, Plus, Thermometer, Timer } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { BeanIcon, BrewIcon, GrindIcon } from "../icons";
import { BREW_IDS, ESPRESSO_DOSE, RECIPES, brewLabel, brewHelpMessage, dose, grindLabel, waWith, type BrewId, type RoastLevel } from "../lib/coffee";
import { Band, PlateImage, Price, RoastMeter, SectionHead, Wrap, btn, num, num1 } from "../ui";
import { st } from "@/lib/i18n/storefront";

export type BrewPick = { slug: string; name: string; image: string; price: number; compareAtPrice: number | null; roast: RoastLevel | null };

function steps(id: BrewId): string[] {
  switch (id) {
    case "filter":
      return [
        st("اشطف الفلتر الورق بمية سخنة وارمي المية."),
        st("حط البن واعمل حفرة صغيرة في النص."),
        st("البلوم: صب ضعف وزن البن مية، واستنى ٣٠–٤٥ ثانية لحد ما يهدى."),
        st("كمّل الصب على دفعات في دواير صغيرة لحد الكمية كلها."),
        st("سيبه يصفّى — المفروض يخلص في دقيقتين ونص لتلاتة."),
      ];
    case "espresso":
      return [
        st("اطحن ناعم ووزّع البن في السلة بالتساوي."),
        st("اضغطه (تامب) بضغطة ثابتة ومستوية."),
        st("ابدأ الاستخلاص: هدفك ضعف وزن البن قهوة في ٢٥–٣٠ ثانية."),
        st("نزل أسرع؟ نعّم الطحنة. نزل أبطأ؟ خشّنها شوية."),
      ];
    case "turkish":
      return [
        st("حط مية ساقعة في الكنكة بعدد الفناجين."),
        st("ضيف البن (والسكر لو بتحبه) وقلّب كويس."),
        st("حطها على نار هادية ومتقلّبش تاني."),
        st("أول ما الوش يعلى ويقرب يفور شيلها من على النار."),
        st("صب الوش في الفناجين الأول، وبعدين الباقي على مهل."),
      ];
    case "french":
      return [
        st("سخّن الإبريق بمية سخنة وفضّيه."),
        st("حط البن الخشن وصب المية كلها مرة واحدة."),
        st("قلّب بالراحة وحط الغطا من غير ما تضغط."),
        st("استنى ٤ دقايق، وشيل الطبقة اللي على الوش."),
        st("اضغط المكبس بالراحة وصب على طول."),
      ];
    case "moka":
      return [
        st("املا القاعدة مية سخنة لحد تحت الصمام."),
        st("املا السلة بن من غير ما تضغطه، وسوّي الوش."),
        st("اقفلها كويس وحطها على نار متوسطة لهادية."),
        st("أول ما القهوة تبدأ تطلع وطّي النار."),
        st("شيلها أول ما تسمع صوت الفوران."),
      ];
    case "cold":
      return [
        st("اطحن خشن وحط البن في برطمان."),
        st("صب مية ساقعة أو عادية وقلّب كويس."),
        st("اقفله وسيبه في التلاجة ١٢–١٨ ساعة."),
        st("صفّيه بفلتر قماش أو ورق."),
        st("خفّفه بنفس كميته مية أو لبن، وحط تلج."),
      ];
  }
}

function clock(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${num(m)}:${num(Math.floor(r / 10))}${num(r % 10)}`;
}

/** "٢:٣٠–٣:٠٠ دقيقة", "٢٥–٣٠ ثانية", "١٢–١٨ ساعة". */
function timeLabel([a, b]: [number, number]) {
  if (a >= 3600) return st("{0}–{1} ساعة", num(a / 3600), num(b / 3600));
  if (b < 60) return st("{0}–{1} ثانية", num(a), num(b));
  return a === b ? st("{0} دقايق", num(a / 60)) : st("{0}–{1} دقيقة", clock(a), clock(b));
}

function cupsLabel(id: BrewId, n: number) {
  if (id === "espresso") return n === 1 ? st("شوت واحد") : st("{0} شوت", num(n));
  if (id === "turkish") return n === 1 ? st("فنجان واحد") : st("{0} فناجين", num(n));
  if (id === "cold") return n === 1 ? st("كوباية واحدة") : st("{0} كوبايات", num(n));
  return n === 1 ? st("كوباية واحدة") : st("{0} كوبايات", num(n));
}

/** "دليل التحضير": pick a brew method and how many cups; the recipe works out
 *  the coffee and water, temperature, grind and time, with the steps — and the
 *  store's own coffees that suit it (from their details or roast). */
export default function BrewGuide({ picks, storeSlug, storeName, whatsappHref }: { picks: Record<BrewId, BrewPick[]>; storeSlug: string; storeName: string; whatsappHref: string | null }) {
  const [method, setMethod] = useState<BrewId>("filter");
  const [cups, setCups] = useState(2);
  const r = RECIPES[method];
  const n = Math.min(cups, r.maxCups);
  const { coffee, water } = dose(r, n);
  const list = picks[method] ?? [];

  const stats = [
    { Icon: BeanIcon, label: st("البن"), value: st("{0} جم", num1(coffee)) },
    method === "espresso"
      ? { Icon: Droplets, label: st("القهوة في الفنجان"), value: st("{0} جم", num(water)) }
      : { Icon: Droplets, label: method === "cold" ? st("المية (مركّز)") : st("المية"), value: st("{0} مل", num(water)) },
    { Icon: Thermometer, label: st("حرارة المية"), value: r.temp ? st("{0}–{1}°", num(r.temp[0]), num(r.temp[1])) : method === "turkish" || method === "cold" ? st("مية ساقعة") : st("مية سخنة") },
    { Icon: Timer, label: st("الوقت"), value: timeLabel(r.time) },
    { Icon: Gauge, label: st("النسبة"), value: st("١ : {0}", num(r.ratio)) },
  ];

  return (
    <Band className="bn-section bn-brew" id="brew-guide">
      <Wrap>
        <SectionHead kicker={st("دليل التحضير")} title={st("حضّرها صح في البيت")} note={st("اختار طريقتك وعدد الفناجين، وإحنا نحسبلك المقادير.")} />
        <div role="tablist" aria-label={st("طرق التحضير")} className="bn-brew-tabs">
          {BREW_IDS.map((id) => (
            <button key={id} type="button" role="tab" aria-selected={id === method} onClick={() => setMethod(id)} className="bn-brew-tab">
              <BrewIcon id={id} />
              <span>{brewLabel(id)}</span>
            </button>
          ))}
        </div>

        <div role="tabpanel" aria-label={brewLabel(method)} className="bn-brew-card">
          <div className="bn-brew-main">
            <div className="bn-brew-top">
              <span className="bn-brew-glyph">
                <BrewIcon id={method} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="bn-h3">{brewLabel(method)}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-(--bn-ink-2)">
                  <GrindIcon id={r.grind} className="size-4" />
                  {st("الطحنة: {0}", grindLabel(r.grind))}
                </p>
              </div>
              <div className="bn-brew-cups">
                <button type="button" onClick={() => setCups(Math.max(1, n - 1))} disabled={n <= 1} aria-label={st("أقل")}>
                  <Minus />
                </button>
                <output aria-live="polite">{cupsLabel(method, n)}</output>
                <button type="button" onClick={() => setCups(Math.min(r.maxCups, n + 1))} disabled={n >= r.maxCups} aria-label={st("أكتر")}>
                  <Plus />
                </button>
              </div>
            </div>

            <dl className="bn-brew-stats">
              {stats.map(({ Icon, label, value }) => (
                <div key={label}>
                  <dt>
                    <Icon aria-hidden />
                    {label}
                  </dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {method === "espresso" && <p className="mt-3 text-xs text-(--bn-ink-2)">{st("الحساب على شوت دبل: {0} جم بن لكل شوت.", num(ESPRESSO_DOSE))}</p>}

            <ol className="bn-brew-steps">
              {steps(method).map((s, i) => (
                <li key={i}>
                  <span className="bn-num">{num(i + 1)}</span>
                  <p>{s}</p>
                </li>
              ))}
            </ol>
          </div>

          <aside className="bn-brew-side" aria-label={st("بن يناسب الطريقة دي")}>
            <p className="bn-kicker">{st("بن يناسب {0}", brewLabel(method))}</p>
            {list.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {list.slice(0, 3).map((p) => (
                  <li key={p.slug}>
                    <Link href={buildStoreUrl(storeSlug, `/products/${p.slug}`)} className="bn-belt-item group">
                      <span className="bn-plate relative size-14 shrink-0 overflow-hidden">
                        <PlateImage src={p.image} sizes="56px" className="bn-zoom" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="bn-display line-clamp-1 block text-[0.9375rem]">{p.name}</span>
                        <span className="mt-1 flex items-center gap-3">
                          <Price price={p.price} compareAt={p.compareAtPrice} size="sm" />
                          {p.roast && <RoastMeter level={p.roast} />}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-7 text-(--bn-ink-2)">{st("اسألنا وهنرشحلك البن المناسب لطريقتك.")}</p>
            )}
            {whatsappHref && (
              <a href={waWith(whatsappHref, brewHelpMessage(storeName, brewLabel(method)))} target="_blank" rel="noopener noreferrer" className={btn({ variant: "outline", size: "sm", className: "mt-5" })}>
                {st("محتار؟ اسألنا على واتساب")}
              </a>
            )}
          </aside>
        </div>
      </Wrap>
    </Band>
  );
}
