const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const output = path.join(root, "dist");
const header = fs.readFileSync(path.join(root, "components/workspace-header.html"), "utf8").trim();
const footer = fs.readFileSync(path.join(root, "components/workspace-footer.html"), "utf8").trim();

// Copy each project entry into dist individually. Copying the project root
// directly into its own child directory causes ERR_FS_CP_EINVAL in Node.js.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const excluded = new Set([".git", ".vercel", "node_modules", "dist", "components", "scripts"]);
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  const source = path.join(root, entry.name);
  const destination = path.join(output, entry.name);
  fs.cpSync(source, destination, { recursive: true });
}

function replaceFooterBlock(html, replacement, file) {
  const start = html.indexOf('<div class="site-footer"');
  if (start < 0) throw new Error(`Footer wrapper not found in ${file}`);
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tags.exec(html))) {
    if (/^<div\b/i.test(match[0])) depth++;
    else if (/^<\/div/i.test(match[0])) depth--;
    if (depth === 0) {
      return html.slice(0, start) + replacement + html.slice(tags.lastIndex);
    }
  }
  throw new Error(`Footer wrapper is not balanced in ${file}`);
}

const expectedWorkspacePages = {
  "booking-sheet.html": "page-booking",
  "fob-costing.html": "page-pricing",
  "help-faq.html": "page-faq",
  "knit-fabric-cost.html": "page-pricing",
  "knit-garments.html": "page-knit",
  "knit-pant.html": "page-knitpant",
  "marker-consumption.html": "page-marker",
  "my-workspace.html": "page-myformulas",
  "pricing-costing.html": "page-pricing",
  "size-ratio.html": "page-sizeratio",
  "trims.html": "page-trims",
  "unit-converter.html": "page-converter",
  "woven-shirt.html": "page-woven",
  "zipper.html": "page-zipper"
};

function validateDedicatedPage(html, expectedId, file) {
  const wrappers = [...html.matchAll(/<(?:div|section)\\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => /\\bclass=["'][^"']*\\bpage\\b[^"']*["']/i.test(tag))
    .map(tag => (tag.match(/\\bid=["']([^"']+)["']/i) || [])[1])
    .filter(Boolean);
  if (wrappers.length !== 1 || wrappers[0] !== expectedId) {
    throw new Error(
      `Expected only ${expectedId} in ${file}; found: ${wrappers.join(", ") || "no page wrapper"}`
    );
  }
}

const folders = ["pages", "information"];
let processed = 0;
for (const folder of folders) {
  const sourceDir = path.join(root, folder);
  const outputDir = path.join(output, folder);
  if (!fs.existsSync(sourceDir)) continue;
  for (const name of fs.readdirSync(sourceDir)) {
    if (!name.endsWith(".html")) continue;
    const sourceFile = path.join(sourceDir, name);
    const outputFile = path.join(outputDir, name);
    let html = fs.readFileSync(sourceFile, "utf8");
    if (folder === "pages" && expectedWorkspacePages[name]) {
      validateDedicatedPage(html, expectedWorkspacePages[name], `${folder}/${name}`);
    }
    if (!/<header\b[\s\S]*?<\/header>/i.test(html)) {
      throw new Error(`Header not found in ${folder}/${name}`);
    }
    html = html.replace(/<header\b[\s\S]*?<\/header>/i, header);
    html = replaceFooterBlock(html, footer, sourceFile);
    html = html.replace(/\/css\/style\.css\?v=[^"' ]+/g, "/css/style.css?v=20261127-shared-layout-v1");
    fs.writeFileSync(outputFile, html, "utf8");
    processed++;
  }
}
if (processed !== 19) {
  throw new Error(`Expected 19 workspace/information pages; built ${processed}`);
}
console.log(`Built ${processed} pages with one shared workspace header and footer.`);
