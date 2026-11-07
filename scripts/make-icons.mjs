// Renders the PWA icons from the brand mark with Playwright. Run: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';

const mark = (size, pad, radius) => `<!doctype html><body style="margin:0">
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
<rect width="64" height="64" rx="${radius}" fill="#2a1a10"/>
<g transform="translate(${pad} ${pad}) scale(${(64 - pad * 2) / 64})">
<path d="M15 34c5 3 9 8 11 13 6-15 14-25 24-32" fill="none" stroke="#d4ec3f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g></svg></body>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, pad, radius] of [
	['icon-192.png', 192, 0, 14],
	['icon-512.png', 512, 0, 14],
	['icon-maskable-512.png', 512, 10, 0],
	['apple-touch-icon.png', 180, 4, 0]
]) {
	await page.setViewportSize({ width: size, height: size });
	await page.setContent(mark(size, pad, radius));
	await page.screenshot({ path: `static/icons/${file}`, omitBackground: true });
}
await browser.close();
console.log('icons written to static/icons');
