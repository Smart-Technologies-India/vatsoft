/**
 * Script: add-auth-guard.js
 * Adds authentication guards to all private Next.js server actions.
 *
 * Dealer actions  → check getCurrentUserId() AND getCurrentDvatId()
 * Admin actions   → check getCurrentUserId() only
 * Public actions  → skip entirely
 */

const fs = require("fs");
const path = require("path");

const BASE = path.resolve(__dirname, "../src/action");

// ─── Skip completely (public / auth-flow actions) ────────────────────────────
const SKIP = [
  /[/\\]user[/\\]login\.ts$/,
  /[/\\]user[/\\]loginotp\.ts$/,
  /[/\\]user[/\\]passwordlogin\.ts$/,
  /[/\\]user[/\\]dvatpasswordlogin\.ts$/,
  /[/\\]user[/\\]mobileloginotp\.ts$/,
  /[/\\]user[/\\]tinloginotp\.ts$/,
  /[/\\]user[/\\]tinsendotp\.ts$/,
  /[/\\]user[/\\]sendotp\.ts$/,
  /[/\\]user[/\\]verifyotp\.ts$/,
  /[/\\]user[/\\]sendforgetpasswordotp\.ts$/,
  /[/\\]user[/\\]verifyforgetpasswordotp\.ts$/,
  /[/\\]user[/\\]resetmobilepasswordotp\.ts$/,
  /[/\\]user[/\\]resetforgotpassword\.ts$/,
  /[/\\]user[/\\]genpass\.ts$/,
  /[/\\]user[/\\]register[/\\]/,
  /[/\\]auth[/\\]logout\.ts$/,
  /[/\\]auth[/\\]getuserid\.ts$/,
  /[/\\]auth[/\\]updatedvatid\.ts$/,
  /[/\\]state[/\\]/,
  /[/\\]new[/\\]/,
  /[/\\]verify[/\\]/,
  /[/\\]test\.ts$/,
];

// ─── Admin-only folders (userId check only – dept users have no dvatId) ──────
const ADMIN_FOLDERS = [
  "commoditymaster",
  "holiday",
  "hsncode",
  "news",
  "oice",
  "parctitioner",
  "report",
  "tin_number",
  "registration",
  "query",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function allTs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...allTs(fp));
    else if (e.name.endsWith(".ts")) out.push(fp);
  }
  return out;
}

function shouldSkip(fp) {
  return SKIP.some((p) => p.test(fp));
}

function isAdminFolder(fp) {
  return ADMIN_FOLDERS.some((f) =>
    fp.includes(path.sep + f + path.sep) || fp.endsWith(path.sep + f + ".ts")
  );
}

/** Check whether the file already has an auth guard injected by this script or a previous pass */
function hasAuthGuard(src) {
  return (
    /if\s*\(!currentUserId/.test(src) ||
    /if\s*\(!currentDvatId/.test(src) ||
    /getCurrentUserId\(\)/.test(src) ||
    /getCurrentDvatId\(\)/.test(src) ||
    /requireAuth\(\)/.test(src)
  );
}

/** Extract the first async function name in the file */
function extractFuncName(src) {
  const m =
    src.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*async\s*\(/) ||
    src.match(/export\s+async\s+function\s+([A-Za-z0-9_]+)/);
  return m ? m[1] : "action";
}

/** Add or amend the import from @/lib/auth */
function patchImport(src, needsDvat) {
  const hasImport = /from\s+"@\/lib\/auth"/.test(src);

  if (!hasImport) {
    const funcs = needsDvat
      ? "getCurrentUserId, getCurrentDvatId"
      : "getCurrentUserId";
    const line = `import { ${funcs} } from "@/lib/auth";`;
    // Find the END of the last import statement, including multi-line imports.
    // We look for the last occurrence of `} from "..."` or `from "..."` which
    // always appears on its own line as the closing of an import.
    const fromLines = [...src.matchAll(/^(?:}\s*)?from\s+["'].*["'];?\s*$/gm)];
    const lastFrom = fromLines.pop();
    if (lastFrom) {
      const pos = lastFrom.index + lastFrom[0].length;
      return src.slice(0, pos) + "\n" + line + src.slice(pos);
    }
    return src.replace('"use server";', '"use server";\n' + line);
  }

  // Amend existing import
  let out = src;
  if (!src.includes("getCurrentUserId")) {
    out = out.replace(
      /import\s*\{([^}]+)\}\s*from\s*"@\/lib\/auth"/,
      (_, g) => `import { ${g.trim()}, getCurrentUserId } from "@/lib/auth"`
    );
  }
  if (needsDvat && !src.includes("getCurrentDvatId")) {
    out = out.replace(
      /import\s*\{([^}]+)\}\s*from\s*"@\/lib\/auth"/,
      (_, g) => `import { ${g.trim()}, getCurrentDvatId } from "@/lib/auth"`
    );
  }
  return out;
}

/** Build the guard block to insert */
function buildGuard(funcName, needsDvat) {
  if (needsDvat) {
    return (
      `\n    const currentUserId = await getCurrentUserId();\n` +
      `    const currentDvatId = await getCurrentDvatId();\n` +
      `    if (!currentUserId || !currentDvatId) {\n` +
      `      return {\n` +
      `        status: false,\n` +
      `        data: null,\n` +
      `        message: "Not authenticated. Please login.",\n` +
      `        functionname: "${funcName}",\n` +
      `      } as any;\n` +
      `    }\n`
    );
  }
  return (
    `\n    const currentUserId = await getCurrentUserId();\n` +
    `    if (!currentUserId) {\n` +
    `      return {\n` +
    `        status: false,\n` +
    `        data: null,\n` +
    `        message: "Not authenticated. Please login.",\n` +
    `        functionname: "${funcName}",\n` +
    `      } as any;\n` +
    `    }\n`
  );
}

/** Insert guard right after the FIRST `try {` */
function insertGuard(src, guard) {
  return src.replace(/(\btry\s*\{)/, `$1${guard}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const files = allTs(BASE);
const stats = { modified: 0, alreadyOk: 0, skipped: 0, noTry: 0 };
const modifiedFiles = [];

for (const fp of files) {
  const src = fs.readFileSync(fp, "utf8");

  if (!src.includes('"use server"')) { stats.skipped++; continue; }
  if (shouldSkip(fp))               { stats.skipped++; continue; }
  if (hasAuthGuard(src))            { stats.alreadyOk++; continue; }
  if (!/\btry\s*\{/.test(src))      { stats.noTry++; console.warn("NO TRY:", fp); continue; }

  const admin     = isAdminFolder(fp);
  const needsDvat = !admin;
  const funcName  = extractFuncName(src);
  const guard     = buildGuard(funcName, needsDvat);

  let out = patchImport(src, needsDvat);
  out = insertGuard(out, guard);

  if (out !== src) {
    fs.writeFileSync(fp, out, "utf8");
    stats.modified++;
    modifiedFiles.push(path.relative(BASE, fp));
  }
}


modifiedFiles.forEach((f) => console.log("  ✓", f));
