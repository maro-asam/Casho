import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { BrewIcon, GrindIcon } from "../icons";
import { ROAST_COLORS, RECIPES, brewLabel, brewsForRoast, grindLabel, roastLabel, type CoffeeProfile, type RoastLevel } from "../lib/coffee";
import { Band, Kicker, Notes, TextLink, Wrap, num } from "../ui";
import Stamp from "../sections/Stamp";
import { st } from "@/lib/i18n/storefront";

function timeShort([a, b]: [number, number]) {
  if (a >= 3600) return st("{0}–{1} ساعة", num(a / 3600), num(b / 3600));
  if (b < 60) return st("{0}–{1} ث", num(a), num(b));
  return a === b ? st("{0} د", num(a / 60)) : st("{0}–{1} د", num(Math.round((a / 60) * 10) / 10), num(Math.round((b / 60) * 10) / 10));
}

/** "بطاقة المحصول": the coffee's details laid out like a specialty bag's
 *  label — the origin big beside the stamp, the farm facts in a ruled grid,
 *  the roast on a five-step scale, the notes in their flavor colors — and
 *  the brew methods it suits with a short recipe for each. Only what the
 *  merchant gave is shown. */
export default function Passport({ profile, name, storeSlug, storeName }: { profile: CoffeeProfile; name: string; storeSlug: string; storeName: string }) {
  const facts = [
    profile.region && { k: st("المنطقة"), v: profile.region },
    profile.farm && { k: st("المزرعة / المنتج"), v: profile.farm },
    profile.process && { k: st("المعالجة"), v: profile.process },
    profile.altitude && { k: st("الارتفاع"), v: profile.altitude },
    profile.variety && { k: st("السلالة"), v: profile.variety },
    profile.harvest && { k: st("الحصاد"), v: profile.harvest },
    profile.score && { k: st("تقييم التذوّق"), v: profile.score },
  ].filter(Boolean) as { k: string; v: string }[];
  const named = profile.brew.length > 0;
  const brews = (named ? profile.brew : brewsForRoast(profile.roast?.level ?? null)).slice(0, 4);
  if (!profile.origin && facts.length === 0 && !profile.roast && profile.notes.length === 0) return null;

  return (
    <Band tone="alt" className="bn-section" id="passport">
      <Wrap>
        <div className="bn-passport bn-reveal">
          <div className="bn-passport-head">
            <div className="min-w-0">
              <Kicker>{st("بطاقة المحصول")}</Kicker>
              <p className="bn-passport-origin">{profile.origin?.label ?? name}</p>
              {profile.origin && <p className="mt-1 text-sm text-(--bn-ink-2)">{name}</p>}
            </div>
            <Stamp words={[storeName, profile.origin?.label ?? ""]} className="bn-passport-stamp" />
          </div>

          {facts.length > 0 && (
            <dl className="bn-passport-facts">
              {facts.map((f) => (
                <div key={f.k}>
                  <dt>{f.k}</dt>
                  <dd>{f.v}</dd>
                </div>
              ))}
            </dl>
          )}

          {(profile.roast || profile.notes.length > 0) && (
            <div className="bn-passport-taste">
              {profile.roast && (
                <div className="min-w-0">
                  <p className="bn-passport-label">{st("درجة التحميص")}</p>
                  <ol className="bn-roastscale" aria-label={st("درجة التحميص: {0}", profile.roast.text)}>
                    {([1, 2, 3, 4, 5] as RoastLevel[]).map((l) => (
                      <li key={l} data-on={l === profile.roast!.level || undefined} style={{ ["--bean" as string]: ROAST_COLORS[l] }}>
                        <i aria-hidden />
                        <span>{roastLabel(l)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {profile.notes.length > 0 && (
                <div className="min-w-0">
                  <p className="bn-passport-label">{st("هتحس فيها بـ")}</p>
                  <Notes notes={profile.notes} max={6} chips className="mt-3" />
                </div>
              )}
            </div>
          )}
        </div>

        {brews.length > 0 && (
          <div className="bn-passport-brews">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Kicker>{named ? st("أحسن طريقة تحضّرها بيها") : st("مقترح للتحميص ده")}</Kicker>
                <p className="mt-1 text-sm text-(--bn-ink-2)">{named ? st("الطرق اللي المحمصة بترشحها للبن ده.") : st("طرق بتطلّع أحسن ما في درجة التحميص دي.")}</p>
              </div>
              <TextLink href={`${buildStoreUrl(storeSlug)}#brew-guide`}>{st("دليل التحضير الكامل")}</TextLink>
            </div>
            <ul className="bn-recipes">
              {brews.map((id) => {
                const r = RECIPES[id];
                return (
                  <li key={id} className="bn-recipe">
                    <BrewIcon id={id} className="bn-recipe-icon" />
                    <p className="bn-display text-[1.0625rem]">{brewLabel(id)}</p>
                    <dl>
                      <div>
                        <dt>{st("النسبة")}</dt>
                        <dd>{st("١ : {0}", num(r.ratio))}</dd>
                      </div>
                      <div>
                        <dt>{st("الحرارة")}</dt>
                        <dd>{r.temp ? st("{0}–{1}°", num(r.temp[0]), num(r.temp[1])) : id === "moka" ? st("سخنة") : st("ساقعة")}</dd>
                      </div>
                      <div>
                        <dt>{st("الوقت")}</dt>
                        <dd>{timeShort(r.time)}</dd>
                      </div>
                    </dl>
                    <p className="bn-recipe-grind">
                      <GrindIcon id={r.grind} />
                      {grindLabel(r.grind)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Wrap>
    </Band>
  );
}
