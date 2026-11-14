"use client";

import { Check } from "lucide-react";
import Reveal from "../apple/Reveal";
import SectionHead from "../apple/SectionHead";
import { useCompareCopy } from "./copy";

/**
 * Apple's compare-table language: a sticky column header, groups with a
 * small gray title, hairline rows. Words in every cell (never bare ticks and
 * crosses) so each claim says exactly what it means. Phones keep the two
 * columns and lift the feature name above them.
 */
export default function CompareTable() {
  const c = useCompareCopy().compare;

  return (
    <section id="compare" aria-labelledby="compare-title" className="al-section scroll-mt-16">
      <SectionHead id="compare-title" eyebrow={c.eyebrow} title={c.title} accent={c.accent} />

      <div className="al-container al-body">
        <Reveal>
          <table className="cmp-table">
            <colgroup>
              <col className="cmp-col-feature" />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="cmp-feature-head">
                  <span className="sr-only">{c.feature}</span>
                </th>
                <th scope="col">
                  <span className="inline-flex items-center gap-2">
                    <span className="cmp-dot" aria-hidden />
                    {c.casho}
                  </span>
                </th>
                <th scope="col">{c.shopify}</th>
              </tr>
            </thead>
            {c.groups.map((group) => (
              <tbody key={group.title}>
                <tr className="cmp-group">
                  <th scope="colgroup" colSpan={3}>
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label} className="cmp-row">
                    <th scope="row">{row.label}</th>
                    <td>
                      <span className="cmp-value font-semibold">
                        <Check className="mt-[0.3em] size-4 shrink-0 text-(--al-tint)" strokeWidth={2.6} aria-hidden />
                        {row.casho}
                      </span>
                      {row.cashoNote ? <span className="cmp-note">{row.cashoNote}</span> : null}
                    </td>
                    <td>
                      <span className="cmp-value">{row.shopify}</span>
                      {row.shopifyNote ? <span className="cmp-note">{row.shopifyNote}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </Reveal>
      </div>
    </section>
  );
}
