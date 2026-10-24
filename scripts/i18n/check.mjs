// Merchant-dashboard i18n checker + key extractor.
//
//   node scripts/i18n/check.mjs            → report problems, write scripts/i18n/keys.json
//   node scripts/i18n/check.mjs --missing  → also list keys with no English entry
//
// Problems reported:
//   - tr()/lazy getters evaluated at module load (text would freeze in Arabic)
//   - Arabic string literals left unwrapped in dashboard code
import { Project, SyntaxKind, Node } from "ts-morph";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const ARABIC = /[؀-ۿ]/;
const SCOPE = [
  "app/(merchant)",
  "components/saas-page",
  "components/entitlements",
  "components/branch",
  "components/shipping",
  "components/common",
  "components/payments",
  "lib/i18n/dashboard",
];
// Server-side message sources: not rewritten, but their static strings are
// looked up at runtime when shown in a toast/error (trv).
const MESSAGE_SOURCES = ["actions", "validations", "lib/store", "lib/inventory", "lib/entitlements", "lib/shipping", "lib/offers", "lib/pos", "lib/crm", "lib/coupons", "lib/integrations", "lib/billing", "lib/balance-ui", "lib/custom-domain", "lib/notifications"];
const MESSAGE_SKIP = ["actions/admin", "actions/sales", "lib/notifications/email"];

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

// Exported objects whose initializer holds translated getters, by file.
const exportedGetters = new Map();
for (const sf of project.getSourceFiles()) {
  if (!under(rel(sf), SCOPE)) continue;
  for (const d of sf.getVariableDeclarations()) {
    if (d.isExported() && d.getInitializer()?.getDescendantsOfKind(SyntaxKind.GetAccessor).length) {
      exportedGetters.set(`${sf.getFilePath()}#${d.getName()}`, true);
    }
  }
}

for (const sf of project.getSourceFiles()) {
  const f = rel(sf);
  if (/\.test\.tsx?$/.test(f) || f.startsWith("node_modules")) continue;

  if (under(f, SCOPE)) {
    const getterVars = new Set();
    sf.getVariableDeclarations().forEach((d) => {
      if (d.getInitializer()?.getDescendantsOfKind(SyntaxKind.GetAccessor).length) getterVars.add(d.getName());
    });
    for (const imp of sf.getImportDeclarations()) {
      const target = imp.getModuleSpecifierSourceFile();
      if (!target) continue;
      for (const named of imp.getNamedImports()) {
        if (exportedGetters.has(`${target.getFilePath()}#${named.getName()}`)) getterVars.add(named.getAliasNode()?.getText() ?? named.getName());
      }
    }

    sf.forEachDescendant((n) => {
      // keys
      if (Node.isCallExpression(n) && ["tr", "trIn"].includes(n.getExpression().getText())) {
        const arg = n.getArguments()[n.getExpression().getText() === "trIn" ? 1 : 0];
        if (arg && (Node.isStringLiteral(arg) || Node.isNoSubstitutionTemplateLiteral(arg))) add(keys, arg.getLiteralValue(), f);
        if (!inFunction(n)) problems.push(`${f}:${n.getStartLineNumber()}  tr() runs at module load`);
      }
      // unwrapped Arabic
      if ((Node.isStringLiteral(n) || Node.isNoSubstitutionTemplateLiteral(n)) && ARABIC.test(n.getLiteralValue())) {
        const p = n.getParent();
        const isTrArg = Node.isCallExpression(p) && ["tr", "trIn", "lazyList"].includes(p.getExpression().getText());
        const listCall = Node.isArrayLiteralExpression(p) ? p.getFirstAncestor((a) => !Node.isAsExpression(a) && !Node.isParenthesizedExpression(a) && !Node.isArrayLiteralExpression(a)) : null;
        const inList = !!listCall && Node.isCallExpression(listCall) && listCall.getExpression().getText() === "lazyList";
        const ok = isTrArg || inList || (Node.isPropertyAssignment(p) && p.getNameNode() === n) || Node.isCaseClause(p) || Node.isLiteralTypeNode(p) || (Node.isBinaryExpression(p) && /^[!=]==?$/.test(p.getOperatorToken().getText())) || Node.isExpressionStatement(p) || (Node.isJsxAttribute(p) && ["key", "value", "id", "name", "dir", "lang"].includes(p.getNameNode().getText()));
        const ignored = /i18n-ignore/.test(sf.getFullText().split("\n").slice(Math.max(0, n.getStartLineNumber() - 6), n.getEndLineNumber() + 1).join("\n"));
        if (!ok && !ignored && !f.startsWith("lib/i18n/")) problems.push(`${f}:${n.getStartLineNumber()}  unwrapped: ${n.getLiteralValue().slice(0, 60)}`);
        if (inList) add(keys, n.getLiteralValue(), f);
      }
      if (Node.isJsxText(n) && ARABIC.test(n.getText())) problems.push(`${f}:${n.getStartLineNumber()}  unwrapped JSX text: ${n.getText().trim().slice(0, 60)}`);
      // module-level reads of getter objects
      if (Node.isIdentifier(n) && getterVars.has(n.getText()) && !inFunction(n)) {
        const p = n.getParent();
        const isDecl = Node.isVariableDeclaration(p) && p.getNameNode() === n;
        const isExport = Node.isExportSpecifier(p) || Node.isExportAssignment(p);
        const isAssignTarget = Node.isElementAccessExpression(p) && Node.isBinaryExpression(p.getParent()) && p.getParent().getLeft() === p;
        const isImport = Node.isImportSpecifier(p);
        const prevLine = sf.getFullText().split("\n")[n.getStartLineNumber() - 2] ?? "";
        if (!isDecl && !isExport && !isAssignTarget && !isImport && !Node.isTypeQuery(p) && !/i18n-ignore/.test(prevLine)) problems.push(`${f}:${n.getStartLineNumber()}  module-level read of translated object "${n.getText()}"`);
      }
    });
  }

  // tr() keys used anywhere else (shared lib/constants files).
  if (!under(f, SCOPE)) {
    sf.forEachDescendant((n) => {
      if (Node.isCallExpression(n) && n.getExpression().getText() === "tr") {
        const arg = n.getArguments()[0];
        if (arg && (Node.isStringLiteral(arg) || Node.isNoSubstitutionTemplateLiteral(arg))) add(keys, arg.getLiteralValue(), f);
      }
    });
  }

  if (under(f, MESSAGE_SOURCES) && !under(f, MESSAGE_SKIP)) {
    sf.forEachDescendant((n) => {
      if ((Node.isStringLiteral(n) || Node.isNoSubstitutionTemplateLiteral(n)) && ARABIC.test(n.getLiteralValue())) {
        const p = n.getParent();
        if (Node.isPropertyAssignment(p) && p.getNameNode() === n) return;
        add(messageKeys, n.getLiteralValue(), f);
      }
      if (Node.isTemplateExpression(n) && ARABIC.test(n.getText()) && !Node.isTaggedTemplateExpression(n.getParent())) add(messageKeys, templateKey(n), f);
    });
  }
}

const out = {
  ui: Object.fromEntries([...keys].sort(([a], [b]) => a.localeCompare(b)).map(([k, s]) => [k, [...s]])),
  messages: Object.fromEntries([...messageKeys].filter(([k]) => !keys.has(k)).sort(([a], [b]) => a.localeCompare(b)).map(([k, s]) => [k, [...s]])),
};
fs.writeFileSync(path.join(ROOT, "scripts/i18n/keys.json"), JSON.stringify(out, null, 1));

let missing = [];
if (process.argv.includes("--missing")) {
  const dir = path.join(ROOT, "lib/i18n/dashboard/en");
  const en = {};
  for (const file of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) Object.assign(en, JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  missing = [...keys.keys(), ...Object.keys(out.messages)].filter((k) => en[k] === undefined && en[norm(k)] === undefined);
  fs.writeFileSync(path.join(ROOT, "scripts/i18n/missing.json"), JSON.stringify(missing, null, 1));
}

for (const p of problems) console.log(p);
console.log(`\n${keys.size} UI keys, ${Object.keys(out.messages).length} server message keys, ${problems.length} problems${missing.length ? `, ${missing.length} missing English` : ""}`);
process.exitCode = problems.length ? 1 : 0;
