import fs from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const outDir = path.join(root, 'export_web');
const newsletterJsonPath = path.join(root, 'newsletter.json');

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found. Run: npm run build');
  process.exit(1);
}
if (!fs.existsSync(newsletterJsonPath)) {
  console.error('newsletter.json not found in project root.\n\nExport JSON from the app (TopBar → Export JSON), then place/rename it as newsletter.json in the project root.');
  process.exit(1);
}

rmrf(outDir);
copyDir(distDir, outDir);
fs.copyFileSync(newsletterJsonPath, path.join(outDir, 'newsletter.json'));

// Force preview route for portability
const indexPath = path.join(outDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

if (!html.includes('location.hash')) {
  html = html.replace(
    '</body>',
    `<script>(function(){\n  if(!location.hash || location.hash==="#/" || location.hash==="#") location.hash="#/preview";\n})();</script>\n</body>`
  );
}

fs.writeFileSync(indexPath, html, 'utf-8');

console.log('✅ export_web/ created. Upload the CONTENTS of export_web/ to your hosting.');
console.log('   - It will load preview mode automatically (#/preview).');
console.log('   - RSS will live-fetch at runtime when internet is available, otherwise it will display the last saved snapshot.');
