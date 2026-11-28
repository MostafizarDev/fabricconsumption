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

const transitionStyle = `<style id="fc-page-transition">
html { background: #f0f4f8; }
html.dark-mode { background: #0b1120; color-scheme: dark; }
html:not(.dark-mode) { color-scheme: light; }
html.dark-mode body { background: #0b1120; }
</style>`;

const pageTransitionHead = [
  transitionStyle,
  '<script id="fc-theme-early">',
  '(function () {',
  '  try {',
  "    var savedTheme = localStorage.getItem('fc-theme');",
  "    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;",
  "    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) document.documentElement.classList.add('dark-mode');",
  '  } catch (error) {}',
  '})();',
  '</script>'
].join("\n");

function replaceFooterBlock(html, replacement, sourceFile) {
  const start = html.indexOf('<div class="site-footer"');
  if (start < 0) throw new Error(`Footer not found in ${sourceFile}`);
  const tags = /<div\b[^>]*>|<\/div>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match;
  let end = -1;
  while ((match = tags.exec(html))) {
    if (/^<div\b/i.test(match[0])) depth++;
    else depth--;
    if (depth === 0) { end = tags.lastIndex; break; }
  }
  if (end < 0) throw new Error(`Footer markup is unbalanced in ${sourceFile}`);
  const trailing = html.slice(end);
  const scriptMatch = trailing.match(/^\s*<script>\s*if \(typeof window\.copyFooterShareLink[\s\S]*?<\/script>/);
  if (scriptMatch) end += scriptMatch[0].length;
  return html.slice(0, start) + replacement + html.slice(end);
}

function stabilizeFontLoading(html) {
  // Prevent late Google Font swaps from resizing the shared header after first paint.
  html = html.replace(
    /(fonts\.googleapis\.com\/css2?\?[^"'<>]*?)display=swap/gi,
    "$1display=optional"
  );

  if (/fonts\.googleapis\.com\/css2?/i.test(html) &&
      !/<link\b[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.googleapis\.com["']/i.test(html)) {
    const preconnect = '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
    html = html.replace(
      /(<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/css2?[^"']*["'][^>]*>)/i,
      preconnect + "\n$1"
    );
  }

  return html;
}

function injectPageTransition(html) {
  html = stabilizeFontLoading(html);
  if (html.includes('id="fc-page-transition"')) {
    return html.replace(/<style\b[^>]*id=["']fc-page-transition["'][^>]*>[\s\S]*?<\/style>/i, transitionStyle);
  }
  const headStart = html.toLowerCase().indexOf("<head");
  if (headStart < 0) throw new Error("Head element not found while injecting page transition");
  const headEnd = html.indexOf(">", headStart);
  if (headEnd < 0) throw new Error("Head opening tag is incomplete");
  return html.slice(0, headEnd + 1) + "\n" + pageTransitionHead + "\n" + html.slice(headEnd + 1);
}

function activateInitialWorkspace(html, expectedId, sourceFile) {
  const match = [...html.matchAll(/<(?:div|section)\b[^>]*>/gi)]
    .find(([tag]) => tag.includes('id="' + expectedId + '"'));
  if (!match) throw new Error("Initial workspace " + expectedId + " not found in " + sourceFile);
  const updated = match[0].replace(/\bclass=(["'])(.*?)\1/i, (whole, quote, classes) => {
    const clean = classes.split(/\s+/).filter(name => name !== "active");
    clean.push("active");
    return "class=" + quote + clean.join(" ") + quote;
  });
  return html.replace(match[0], updated);
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
      html = activateInitialWorkspace(html, expectedWorkspacePages[name], `${folder}/${name}`);
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

    html = html.replace(/\/css\/style\.css\?v=[^"' ]+/g, "/css/style.css?v=20261128-font-layout-stable-v2");
    html = injectPageTransition(html);
    fs.writeFileSync(outputFile, html, "utf8");
    processed++;
  }
}
const homeFile = path.join(output, "home.html");
if (fs.existsSync(homeFile)) {
  const homeHtml = injectPageTransition(fs.readFileSync(homeFile, "utf8"));
  fs.writeFileSync(homeFile, homeHtml, "utf8");
}

if (processed !== 19) {
  throw new Error(`Expected 19 workspace/information pages; built ${processed}`);
}
console.log(`Built ${processed} pages with initial workspace visibility and transitions disabled.`);
