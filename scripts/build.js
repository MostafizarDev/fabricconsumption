const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const output = path.join(root, "dist");
const header = fs.readFileSync(path.join(root, "components/workspace-header.html"), "utf8").trim();
const footer = fs.readFileSync(path.join(root, "components/workspace-footer.html"), "utf8").trim();

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(root, output, {
  recursive: true,
  filter(entry) {
    const relative = path.relative(root, entry);
    if (!relative) return true;
    const first = relative.split(path.sep)[0];
    return ![".git", ".vercel", "node_modules", "dist"].includes(first);
  }
});

function replaceFooterBlock(html, replacement, file) {
  const start = html.indexOf('<div class="site-footer"');
  if (start < 0) throw new Error(\`Footer wrapper not found in \${file}\`);
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
  throw new Error(\`Footer wrapper is not balanced in \${file}\`);
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
    if (!/<header\b[\s\S]*?<\/header>/i.test(html)) {
      throw new Error(\`Header not found in \${folder}/\${name}\`);
    }
    html = html.replace(/<header\b[\s\S]*?<\/header>/i, header);
    html = replaceFooterBlock(html, footer, sourceFile);
    html = html.replace(/\/css\/style\.css\?v=[^"' ]+/g, "/css/style.css?v=20261127-shared-layout-v1");
    fs.writeFileSync(outputFile, html, "utf8");
    processed++;
  }
}
if (processed !== 19) {
  throw new Error(\`Expected 19 workspace/information pages; built \${processed}\`);
}
console.log(\`Built \${processed} pages with one shared workspace header and footer.\`);
