/**
 * Post-build script: replaces all index.html in out/ with the GitHub Pages
 * redirect so visitors are sent to Firebase Hosting.
 * Run only when DEPLOY_TARGET=github (GitHub Pages build).
 */
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "out");
const REDIRECT_HTML = path.join(__dirname, "github-pages-redirect.html");

function findIndexFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      findIndexFiles(full, list);
    } else if (e.name === "index.html") {
      list.push(full);
    }
  }
  return list;
}

const content = fs.readFileSync(REDIRECT_HTML, "utf8");
const files = findIndexFiles(OUT_DIR);
for (const f of files) {
  fs.writeFileSync(f, content);
}
console.log(`Injected GitHub Pages redirect into ${files.length} index.html file(s)`);
