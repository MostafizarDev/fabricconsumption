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
/* Keep the browser canvas on the correct theme while a dedicated page loads. */
html { background: #f0f4f8; transition: background-color 220ms ease, color 220ms ease; }
html.dark-mode { background: #0b1120; color-scheme: dark; }
html:not(.dark-mode) { color-scheme: light; }
html.dark-mode body { background: #0b1120; }
body { transition: background-color 220ms ease, color 220ms ease; }
@media (prefers-reduced-motion: reduce) {
  html, body { transition: none; }
}
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


function injectEmbeddedWorkspace(html) {
  const embedStyle = `<style id="fc-embedded-workspace-style">
html.fc-embedded-workspace, html.fc-embedded-workspace body { min-height: 100%; height: auto; }
html.fc-embedded-workspace body { overflow-x: hidden; overflow-y: auto; }
html.fc-embedded-workspace body > header,
html.fc-embedded-workspace .tab-bar { display: none !important; }
html.fc-embedded-workspace main { padding-top: 0; }
</style>`;
  const embedScript = `<script id="fc-embedded-workspace-init">
(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    if (window.self === window.top || params.get('embed') !== '1') return;
    document.documentElement.classList.add('fc-embedded-workspace');
    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin || !event.data) return;
      if (event.data.type === 'fc-theme') {
        var dark = event.data.theme === 'dark';
        document.documentElement.classList.toggle('dark-mode', dark);
        document.body.classList.toggle('dark-mode', dark);
        try { localStorage.setItem('fc-theme', dark ? 'dark' : 'light'); } catch (error) {}
      }
    });
  } catch (error) {}
})();
</script>`;
  const headEnd = html.toLowerCase().indexOf('</head>');
  if (headEnd < 0) throw new Error('Head close tag not found for embedded workspace');
  return html.slice(0, headEnd) + embedStyle + '\n' + embedScript + '\n' + html.slice(headEnd);
}

function extractMeta(html, selector) {
  const match = html.match(selector);
  return match ? match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"') : '';
}

function buildWorkspaceShells() {
  const routeDefinitions = [
    ['marker', '/Marker-Consumption', 'marker-consumption.html', 'marker'],
    ['knit', '/knit-garments', 'knit-garments.html', 'knit'],
    ['knitpant', '/knit-pant', 'knit-pant.html', 'knitpant'],
    ['woven', '/woven-shirt', 'woven-shirt.html', 'woven'],
    ['booking', '/booking-sheet', 'booking-sheet.html', 'booking'],
    ['pricing', '/pricing-costing', 'pricing-costing.html', 'pricing'],
    ['knitprice', '/pricing-costing/knit-price', 'pricing-costing.html', 'knitprice'],
    ['fob', '/pricing-costing/fob-costing', 'pricing-costing.html', 'fob'],
    ['zipper', '/zipper', 'zipper.html', 'zipper'],
    ['trims', '/trims', 'trims.html', 'trims'],
    ['sizeratio', '/size-ratio', 'size-ratio.html', 'sizeratio'],
    ['converter', '/converter', 'unit-converter.html', 'converter'],
    ['myformulas', '/my-formulas', 'my-workspace.html', 'myformulas']
  ];
  const source = fs.readFileSync(path.join(output, 'pages/knit-garments.html'), 'utf8');
  const navMatch = source.match(/<nav\b[^>]*class=["'][^"']*\btab-bar\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i);
  if (!navMatch) throw new Error('Workspace navigation not found for persistent shell');
  const navMarkup = navMatch[0];
  const workspaceDir = path.join(output, 'workspace');
  fs.mkdirSync(workspaceDir, { recursive: true });

  const metadata = {};
  for (const [id, route, file, pageId] of routeDefinitions) {
    const pageHtml = fs.readFileSync(path.join(output, 'pages', file), 'utf8');
    const headMatch = pageHtml.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
    if (!headMatch) throw new Error('Page head not found for ' + file);
    const title = extractMeta(pageHtml, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractMeta(pageHtml, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    metadata[id] = { route, title, description, file, pageId };
  }

  for (const [id, route, file, pageId] of routeDefinitions) {
    const pageHtml = fs.readFileSync(path.join(output, 'pages', file), 'utf8');
    const head = pageHtml.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)[1];
    let nav = navMarkup.replace(/\sclass=["']tab-btn active["']/g, ' class="tab-btn"');
    const navPageId = ['knitprice', 'fob'].includes(pageId) ? 'pricing' : pageId;
    nav = nav.replace(new RegExp('<button class="tab-btn"(?=[^>]*data-page="' + navPageId + '")'), '<button class="tab-btn active"');
    const config = JSON.stringify(metadata);
    const shellScript = `<script id="fc-workspace-navigation">
(function () {
  var routes = ${config};
  var currentId = ${JSON.stringify(id)};
  var frame = document.getElementById('workspace-content');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
  var themeButton = document.getElementById('theme-toggle');

  function setActive(pageId) {
    var navId = pageId === 'knitprice' || pageId === 'fob' ? 'pricing' : pageId;
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-page') === navId;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  function applyTheme(dark, notifyFrame) {
    document.documentElement.classList.toggle('dark-mode', dark);
    document.body.classList.toggle('dark-mode', dark);
    try { localStorage.setItem('fc-theme', dark ? 'dark' : 'light'); } catch (error) {}
    if (themeButton) {
      themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      themeButton.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
      themeButton.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
        : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.7 8.7 0 1 0 20.2 15.4Z"/></svg>';
    }
    if (notifyFrame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'fc-theme', theme: dark ? 'dark' : 'light' }, window.location.origin);
    }
  }

  function updateMetadata(item) {
    if (!item) return;
    document.title = item.title;
    var description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', item.description);
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', 'https://fabricconsumption.vercel.app' + item.route);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', item.title);
    var ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', item.description);
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', 'https://fabricconsumption.vercel.app' + item.route);
  }

  function loadPage(pageId, pushState) {
    var item = routes[pageId];
    if (!item) return;
    currentId = pageId;
    if (pushState && window.location.pathname !== item.route) {
      window.history.pushState({ workspacePage: pageId }, '', item.route);
    }
    setActive(pageId);
    updateMetadata(item);
    frame.src = '/pages/' + item.file + '?embed=1&page=' + encodeURIComponent(item.pageId);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var pageId = this.getAttribute('data-page');
      if (pageId && routes[pageId]) loadPage(pageId, true);
    });
  });

  window.addEventListener('popstate', function () {
    var match = Object.keys(routes).find(function (key) { return routes[key].route === window.location.pathname; });
    if (match) loadPage(match, false);
  });

  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin || !event.data || event.data.type !== 'fc-workspace-route') return;
    var pageId = event.data.pageId;
    var item = routes[pageId];
    if (!item) return;
    currentId = pageId;
    if (window.location.pathname !== item.route) window.history.pushState({ workspacePage: pageId }, '', item.route);
    setActive(pageId);
    updateMetadata(item);
  });

  if (themeButton) themeButton.addEventListener('click', function () {
    applyTheme(!document.documentElement.classList.contains('dark-mode'), true);
  });
  frame.addEventListener('load', function () {
    applyTheme(document.documentElement.classList.contains('dark-mode'), true);
  });

  var savedTheme = null;
  try { savedTheme = localStorage.getItem('fc-theme'); } catch (error) {}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark, false);
  setActive(currentId);
  frame.src = '/pages/' + routes[currentId].file + '?embed=1&page=' + encodeURIComponent(routes[currentId].pageId);
})();
</script>`;
    const shellCss = `<style id="fc-workspace-shell-style">
html, body { width:100%; height:100%; min-height:100%; margin:0; overflow:hidden; }
body.fc-workspace-shell { display:flex; flex-direction:column; }
body.fc-workspace-shell > header { flex:0 0 68px; position:relative; top:auto; }
body.fc-workspace-shell > .tab-bar { flex:0 0 auto; position:relative; top:auto; z-index:10; }
.fc-workspace-frame { flex:1 1 auto; min-height:0; width:100%; overflow:hidden; }
.fc-workspace-frame iframe { display:block; width:100%; height:100%; min-height:0; border:0; background:transparent; }
@media (max-width:600px) {
  body.fc-workspace-shell > header { flex-basis:60px; }
}
</style>`;
    const shell = '<!DOCTYPE html>\n<html lang="en">\n<head>' + head + shellCss + '</head>\n<body class="fc-workspace-shell">' +
      header + nav + '<div class="fc-workspace-frame"><iframe id="workspace-content" title="Garment calculator workspace" loading="eager"></iframe></div>' +
      shellScript + '</body>\n</html>';
    const slug = route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'home';
    fs.writeFileSync(path.join(workspaceDir, slug + '.html'), shell, 'utf8');
  }
  return routeDefinitions.length;
}

function injectPageTransition(html) {
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

    html = html.replace(/\/css\/style\.css\?v=[^"' ]+/g, "/css/style.css?v=20261127-shared-layout-v1");
    html = injectPageTransition(html);
    if (folder === "pages" && expectedWorkspacePages[name]) html = injectEmbeddedWorkspace(html);
    fs.writeFileSync(outputFile, html, "utf8");
    processed++;
  }
}
const homeFile = path.join(output, "home.html");
if (fs.existsSync(homeFile)) {
  const homeHtml = injectPageTransition(fs.readFileSync(homeFile, "utf8"));
  fs.writeFileSync(homeFile, homeHtml, "utf8");
}

const workspaceShellCount = buildWorkspaceShells();
if (processed !== 19) {
  throw new Error(`Expected 19 workspace/information pages; built ${processed}`);
}
console.log(`Built ${processed} pages and ${workspaceShellCount} persistent workspace shells.`);
