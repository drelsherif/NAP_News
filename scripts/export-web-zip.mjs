import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const outDir = path.join(root, 'export_web');
const zipPath = path.join(root, 'export_web.zip');
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

function ensurePrereqs() {
  if (!fs.existsSync(distDir)) {
    console.error('dist/ not found. Run: npm run build');
    process.exit(1);
  }
  if (!fs.existsSync(newsletterJsonPath)) {
    console.error(
      'newsletter.json not found in project root.\n\n' +
      'Export JSON from the app (TopBar → Export JSON), then place/rename it as newsletter.json in the project root.'
    );
    process.exit(1);
  }
}

function forcePreviewHash(indexPath) {
  let html = fs.readFileSync(indexPath, 'utf-8');
  if (!html.includes('location.hash')) {
    html = html.replace(
      '</body>',
      `<script>(function(){\n  if(!location.hash || location.hash==="#/" || location.hash==="#") location.hash="#/preview";\n})();</script>\n</body>`
    );
    fs.writeFileSync(indexPath, html, 'utf-8');
  }
}

function zipFolder() {
  rmrf(zipPath);

  const isWin = process.platform === 'win32';
  if (isWin) {
    // Windows: built-in PowerShell zip
    const ps = spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-Command',
        `if(Test-Path "${zipPath}"){Remove-Item "${zipPath}" -Force}; Compress-Archive -Path "${outDir}\\*" -DestinationPath "${zipPath}" -Force`,
      ],
      { stdio: 'inherit' }
    );
    if (ps.status !== 0) {
      console.error('Failed to create zip via PowerShell Compress-Archive.');
      process.exit(1);
    }
    return;
  }

  // macOS / Linux: try system 'zip'
  const which = spawnSync('bash', ['-lc', 'command -v zip >/dev/null 2>&1'], { stdio: 'ignore' });
  if (which.status === 0) {
    const z = spawnSync('bash', ['-lc', `cd "${outDir}" && zip -r "${zipPath}" .`], { stdio: 'inherit' });
    if (z.status !== 0) {
      console.error('Failed to create zip using system zip.');
      process.exit(1);
    }
    return;
  }

  console.warn('⚠️  Could not find a zip utility on this system.');
  console.warn('    export_web/ was created successfully, but export_web.zip was NOT created.');
  console.warn('    Install zip (macOS: brew install zip, Linux: sudo apt-get install zip) or zip manually.');
}

// ─────────────────────────────────────────────────────────────────────────────

ensurePrereqs();
rmrf(outDir);
copyDir(distDir, outDir);
fs.copyFileSync(newsletterJsonPath, path.join(outDir, 'newsletter.json'));
forcePreviewHash(path.join(outDir, 'index.html'));
zipFolder();

console.log('✅ export_web/ created.');
if (fs.existsSync(zipPath)) console.log('✅ export_web.zip created.');
console.log('   - Upload the CONTENTS of export_web/ to hosting, or');
console.log('   - Unzip export_web.zip and host/serve that folder.');
console.log('   - Local test: npx serve export_web');
