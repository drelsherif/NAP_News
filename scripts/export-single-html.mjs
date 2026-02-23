import fs from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const newsletterJsonPath = path.join(root, 'newsletter.json');

function findFirstAsset(ext) {
  const assetsDir = path.join(distDir, 'assets');
  const files = fs.readdirSync(assetsDir);
  const f = files.find(x => x.endsWith(ext));
  if (!f) throw new Error(`Could not find ${ext} in dist/assets`);
  return path.join(assetsDir, f);
}

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found. Run: npm run build');
  process.exit(1);
}
if (!fs.existsSync(newsletterJsonPath)) {
  console.error('newsletter.json not found in project root. Export JSON from the app and rename it to newsletter.json.');
  process.exit(1);
}

const cssPath = findFirstAsset('.css');
const jsPath = findFirstAsset('.js');

const css = fs.readFileSync(cssPath, 'utf-8');
const js = fs.readFileSync(jsPath, 'utf-8');
const newsletter = fs.readFileSync(newsletterJsonPath, 'utf-8');

const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Neurology AI Pulse — Single File Export</title>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>
  window.__NAP_NEWSLETTER__ = ${newsletter};
  location.hash = "#/preview";
</script>
<script type="module">
${js}
</script>
</body>
</html>`;

fs.writeFileSync(path.join(root, 'export_single.html'), out, 'utf-8');
console.log('✅ export_single.html created (open in browser).');
console.log('⚠️ Email clients often block scripts. This is for attaching/sharing as a file, not pasting into an email body.');
