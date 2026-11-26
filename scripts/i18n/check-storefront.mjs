// Storefront i18n checker + key extractor (the dashboard's is ./check.mjs).
//
//   node scripts/i18n/check-storefront.mjs            → report problems, write scripts/i18n/storefront-keys.json
//   node scripts/i18n/check-storefront.mjs --missing  → also list keys with no English entry
//
// Problems reported:
//   - st() evaluated at module load (text would freeze in Arabic)
//   - Arabic string literals / JSX text left unwrapped in storefront code
//
// Keys come from st()/stIn()/stList() in storefront code, plus every Arabic
// literal in MESSAGE_SOURCES: shared modules whose text reaches shoppers and
// is translated where the storefront shows it — st(value) / stv(message).
import { Project, SyntaxKind, Node } from "ts-morph";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const LETTER = /[ء-يٮ-ۓۺ-ۿ]/;
const SCOPE = ["app/store/[slug]", "components/storefront"];
const MESSAGE_SOURCES = [
  "actions/store/cart.actions.ts",
  "actions/store/cart-recovery.actions.ts",
  "actions/store/orders.actions.ts",
  "actions/store/offers.actions.ts",
  "actions/store/loyalty.actions.ts",
  "actions/store/popups.actions.ts",
  "actions/store/order-confirmation.actions.ts",
  "actions/store/track-order.actions.ts",
  "constants/payment-methods.ts",
  "constants/welcome/payment-methods.ts",
  "lib/orders/tracking.ts",
  "lib/orders/track-order.ts",
  "lib/shipping/shipment-status.ts",
  "lib/store-policies/index.ts",
  "lib/conversion/conversion-config.ts",
  "lib/popups/popup-config.ts",
  "lib/coupons/coupon-status.ts",
  "lib/offers/offer-pricing.ts",
  "lib/offers/cart-offers.ts",
  "lib/offers/storefront-offers.ts",
  "lib/products/digital.ts",
];
const TR = new Set(["st", "stIn", "stList", "stRich"]);

const project = new Project({ tsConfigFilePath: path.join(ROOT, "tsconfig.json") });
const rel = (sf) => path.relative(ROOT, sf.getFilePath());
const under = (f, dirs) => dirs.some((d) => f.startsWith(d + "/") || f === d);
const FN = new Set([SyntaxKind.FunctionDeclaration, SyntaxKind.ArrowFunction, SyntaxKind.FunctionExpression, SyntaxKind.MethodDeclaration, SyntaxKind.GetAccessor, SyntaxKind.SetAccessor, SyntaxKind.Constructor]);
const inFunction = (n) => !!n.getFirstAncestor((a) => FN.has(a.getKind()));

const keys = new Map(); // key -> Set(file)
const messageKeys = new Map();
const problems = [];
const add = (map, k, f) => (map.get(k) ?? map.set(k, new Set()).get(k)).add(f);

const templateKey = (tpl) => {
  if (Node.isNoSubstitutionTemplateLiteral(tpl)) return tpl.getLiteralValue();
  let k = tpl.getHead().getLiteralText();
  tpl.getTemplateSpans().forEach((s, i) => (k += `{${i}}` + s.getLiteral().getLiteralText()));
  return k;
};

const ignored = (sf, n) => /i18n-ignore/.test(sf.getFullText().split("\n").slice(Math.max(0, n.getStartLineNumber() - 6), n.getEndLineNumber() + 1).join("\n"));

for (const sf of project.getSourceFiles()) {
  const f = rel(sf);
  if (/\.test\.tsx?$/.test(f) || f.startsWith("node_modules")) continue;

  if (under(f, SCOPE)) {
    sf.forEachDescendant((n) => {
      if (Node.isCallExpression(n) && TR.has(n.getExpression().getText())) {
        const name = n.getExpression().getText();
        const arg = n.getArguments()[name === "stIn" ? 1 : 0];
        if (arg && (Node.isStringLiteral(arg) || Node.isNoSubstitutionTemplateLiteral(arg))) add(keys, arg.getLiteralValue(), f);
        if (name === "stList" && arg && Node.isArrayLiteralExpression(arg)) {
          for (const e of arg.getElements()) if (Node.isStringLiteral(e)) add(keys, e.getLiteralValue(), f);
        }
        if (name !== "stList" && !inFunction(n)) problems.push(`${f}:${n.getStartLineNumber()}  st() runs at module load`);
      }
      if ((Node.isStringLiteral(n) || Node.isNoSubstitutionTemplateLiteral(n)) && LETTER.test(n.getLiteralValue())) {
        const p = n.getParent();
        const isTrArg = Node.isCallExpression(p) && TR.has(p.getExpression().getText());
        const inList = Node.isArrayLiteralExpression(p) && Node.isCallExpression(p.getParent()) && p.getParent().getExpression().getText() === "stList";
        const ok =
          isTrArg ||
          inList ||
          (Node.isPropertyAssignment(p) && p.getNameNode() === n) ||
          Node.isCaseClause(p) ||
          Node.isLiteralTypeNode(p) ||
          (Node.isBinaryExpression(p) && /^[!=]==?$/.test(p.getOperatorToken().getText())) ||
          Node.isExpressionStatement(p) ||
          (Node.isJsxAttribute(p) && ["key", "value", "id", "name", "dir", "lang"].includes(p.getNameNode().getText()));
        if (!ok && !ignored(sf, n)) problems.push(`${f}:${n.getStartLineNumber()}  unwrapped: ${n.getLiteralValue().slice(0, 60)}`);
        // Constants handed to a translating helper (e.g. waWith → st) are keys too.
        if (!ok) add(keys, n.getLiteralValue(), f);
      }
      if (Node.isTemplateExpression(n) && LETTER.test(templateKey(n)) && !Node.isTaggedTemplateExpression(n.getParent())) {
        if (!ignored(sf, n)) problems.push(`${f}:${n.getStartLineNumber()}  unwrapped template: ${n.getText().slice(0, 60)}`);
      }
      if (Node.isJsxText(n) && LETTER.test(n.getText()) && !ignored(sf, n)) problems.push(`${f}:${n.getStartLineNumber()}  unwrapped JSX text: ${n.getText().trim().slice(0, 60)}`);
    });
  }

  // st()/stIn() keys in shared code outside the storefront (customer emails…),
  // plus `t("…")` — the local `const t = (s, ...a) => stIn(lang, s, ...a)` convention.
  if (!under(f, SCOPE) && sf.getImportDeclarations().some((d) => d.getModuleSpecifierValue() === "@/lib/i18n/storefront")) {
    sf.forEachDescendant((n) => {
      if (!Node.isCallExpression(n)) return;
      const name = n.getExpression().getText();
      if (!TR.has(name) && name !== "t") return;
      const arg = n.getArguments()[name === "stIn" ? 1 : 0];
      if (arg && (Node.isStringLiteral(arg) || Node.isNoSubstitutionTemplateLiteral(arg))) add(keys, arg.getLiteralValue(), f);
    });
  }

  if (MESSAGE_SOURCES.includes(f)) {
    sf.forEachDescendant((n) => {
      if ((Node.isStringLiteral(n) || Node.isNoSubstitutionTemplateLiteral(n)) && LETTER.test(n.getLiteralValue())) {
        const p = n.getParent();
        if (Node.isPropertyAssignment(p) && p.getNameNode() === n) return;
        add(messageKeys, n.getLiteralValue(), f);
      }
      if (Node.isTemplateExpression(n) && LETTER.test(n.getText()) && !Node.isTaggedTemplateExpression(n.getParent())) add(messageKeys, templateKey(n), f);
    });
  }
}

// Keys the code builds at runtime (split parts of composite strings).
for (const k of ["المقاس: {0}", "اللون: {0}", "الطحنة: {0}"]) add(keys, k, "app/store/[slug]/_themes/shared/track/TrackedOrderView.tsx");
// Customer status emails translate STATUS_COPY at send time.
{
  const sf = project.getSourceFile(path.join(ROOT, "lib/notifications/email/order-emails.ts"));
  const copy = sf?.getVariableDeclaration("STATUS_COPY")?.getInitializer();
  copy?.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach((n) => LETTER.test(n.getLiteralValue()) && add(keys, n.getLiteralValue(), "lib/notifications/email/order-emails.ts"));
}

const out = {
  ui: Object.fromEntries([...keys].sort(([a], [b]) => a.localeCompare(b)).map(([k, s]) => [k, [...s]])),
  messages: Object.fromEntries([...messageKeys].filter(([k]) => !keys.has(k)).sort(([a], [b]) => a.localeCompare(b)).map(([k, s]) => [k, [...s]])),
};
fs.writeFileSync(path.join(ROOT, "scripts/i18n/storefront-keys.json"), JSON.stringify(out, null, 1));

let missing = [];
if (process.argv.includes("--missing")) {
  const dir = path.join(ROOT, "lib/i18n/storefront/en");
  const en = {};
  for (const file of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) Object.assign(en, JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  missing = [...keys.keys(), ...Object.keys(out.messages)].filter((k) => en[k] === undefined && en[norm(k)] === undefined);
  fs.writeFileSync(path.join(ROOT, "scripts/i18n/storefront-missing.json"), JSON.stringify(missing, null, 1));
}

for (const p of problems) console.log(p);
console.log(`\n${keys.size} UI keys, ${Object.keys(out.messages).length} server message keys, ${problems.length} problems${missing.length ? `, ${missing.length} missing English` : ""}`);
process.exitCode = problems.length ? 1 : 0;
