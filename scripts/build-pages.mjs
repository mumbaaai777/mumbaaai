// Builds web (at /mumbaaai/) and admin (at /mumbaaai/admin/) into pages-dist/ for GitHub Pages.
import { execSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
const withAdmin = existsSync('apps/admin/src/main.tsx');
const base = process.env.PAGES_BASE || '/mumbaaai/';
const run = (cmd, env) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
run('npm run build -w @mumbaaai/shared --if-present');
run('npm run build -w @mumbaaai/web', { VITE_BASE: base });
if (withAdmin) run('npm run build -w @mumbaaai/admin', { VITE_BASE: base + 'admin/' });
rmSync('pages-dist', { recursive: true, force: true });
mkdirSync('pages-dist', { recursive: true });
cpSync('apps/web/dist', 'pages-dist', { recursive: true });
if (withAdmin) cpSync('apps/admin/dist', 'pages-dist/admin', { recursive: true });
copyFileSync('pages-dist/index.html', 'pages-dist/404.html');
if (withAdmin) copyFileSync('pages-dist/admin/index.html', 'pages-dist/admin/404.html');
writeFileSync('pages-dist/.nojekyll', '');
console.log('Pages build ready in pages-dist/');
