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

const pageTransitionHead = "<style id=\"fc-page-transition\">\nhtml { background: #f0f4f8; }\nhtml.dark-mode { background: #0b1120; color-scheme: dark; }\nhtml:not(.dark-mode) { color-scheme: light; }\nhtml.dark-mode body { background: #0b1120; }\n</style>\n<script id=\"fc-theme-early\">\n(function () {\n  try {\n    var savedTheme = localStorage.getItem('fc-theme');\n    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;\n    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) document.documentElement.classList.add('dark-mode');\n  } catch (error) {}\n})();\n</script>";

function injectPageTransition(html) {
  if (html.includes('id="fc-page-transition"')) return html;
  const headStart = html.toLowerCase().indexOf("<head");
  if (headStart < 0) throw new Error("Head element not found while injecting page transition");
  const headEnd = html.indexOf(">", headStart);
  if (headEnd < 0) throw new Error("Head opening tag is incomplete");
  return html.slice(0, headEnd + 1) + "\n" + pageTransitionHead + "\n" + html.slice(headEnd + 1);
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


const expectedPageScripts = {
  "booking-sheet.html": ["booking-sheet.js"],
  "fob-costing.html": ["knit-price.js", "fob.js"],
  "help-faq.html": [],
  "knit-fabric-cost.html": ["knit-price.js", "fob.js"],
  "knit-garments.html": ["knit-garments.js", "fabric-groups.js"],
  "knit-pant.html": ["knit-pant.js", "pant-fabric-groups.js"],
  "marker-consumption.html": ["marker-consumption.js"],
  "my-workspace.html": ["my-formulas.js"],
  "pricing-costing.html": ["knit-price.js", "fob.js"],
  "size-ratio.html": ["size-ratio.js"],
  "trims.html": ["trims.js"],
  "unit-converter.html": ["converter.js"],
  "woven-shirt.html": ["woven-shirt.js"],
  "zipper.html": ["zipper.js"]
};

function validatePageScripts(html, file) {
  const expected = expectedPageScripts[file];
  if (!expected) return;
  const actual = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1].split("?")[0])
    .filter((src) => src.startsWith("/js/"))
    .map((src) => path.basename(src))
    .filter((name) => !["utils.js", "app-init.js"].includes(name));
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  if (JSON.stringify(sortedActual) !== JSON.stringify(sortedExpected)) {
    throw new Error(
      `Unexpected calculator scripts in pages/${file}. Expected [${sortedExpected.join(", ")}], found [${sortedActual.join(", ")}]`
    );
  }
  for (const script of expected) {
    if (!fs.existsSync(path.join(root, "js", script))) {
      throw new Error(`Missing calculator script js/${script} required by pages/${file}`);
    }
  }
}

function validateDedicatedPage(html, expectedId, file) {
  const wrappers = [...html.matchAll(/<(?:div|section)\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => /\bclass=["'][^"']*\bpage\b[^"']*["']/i.test(tag))
    .map(tag => (tag.match(/\bid=["']([^"']+)["']/i) || [])[1])
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
      validatePageScripts(html, name);
    }
    if (!/<header\b[\s\S]*?<\/header>/i.test(html)) {
      throw new Error(`Header not found in ${folder}/${name}`);
    }
    html = html.replace(/<header\b[\s\S]*?<\/header>/i, header);
    html = replaceFooterBlock(html, footer, sourceFile);

    // Set the correct navigation tab in the generated HTML before first paint.
    // Source page templates historically mark Knit Garments active on every page,
    // which causes a visible flash before app-init.js applies URL routing.
    if (folder === "pages" && expectedWorkspacePages[name]) {
      const initialPageId = expectedWorkspacePages[name].replace(/^page-/, "");
      html = html.replace(/class="tab-btn active"(?=[^>]*data-page="knit")/, 'class="tab-btn"');
      const activeTabPattern = new RegExp('class="tab-btn"(?=[^>]*data-page="' + initialPageId + '")');
      if (activeTabPattern.test(html)) {
        html = html.replace(activeTabPattern, 'class="tab-btn active"');
      }
    }

    html = html.replace(/\/css\/style\.css\?v=[^"' ]+/g, "/css/style.css?v=20261127-shared-layout-v1");
    html = injectPageTransition(html);
    fs.writeFileSync(outputFile, html, "utf8");
    processed++;
  }
}
if (processed !== 19) {
  throw new Error(`Expected 19 workspace/information pages; built ${processed}`);
}
console.log(`Built ${processed} pages with one shared workspace header and footer.`);
