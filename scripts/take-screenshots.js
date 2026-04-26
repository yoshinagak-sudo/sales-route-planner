// 営業訪問プランナー 概要書用スクショ取得スクリプト
// 使い方:
//   SCREENSHOT_BASE_URL="http://localhost:3001" node scripts/take-screenshots.js
// 出力: docs/screenshots/*.png

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3001';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

const MOBILE_VP = { width: 390, height: 844 };
const DESKTOP_VP = { width: 1440, height: 900 };

const PAGES = [
  // モバイル
  {
    name: 'mobile-home',
    path: '/',
    device: 'mobile',
    fullPage: false,
    waitMs: 1500,
  },
  {
    name: 'mobile-account-detail',
    path: '/accounts/acc-005',
    device: 'mobile',
    fullPage: false,
    waitMs: 1500,
  },
  {
    name: 'mobile-visit-record',
    path: '/visits/vis-014/record',
    device: 'mobile',
    fullPage: true,
    waitMs: 1500,
  },

  // デスクトップ
  {
    name: 'desktop-home',
    path: '/',
    device: 'desktop',
    fullPage: false,
    waitMs: 1500,
  },
  {
    name: 'desktop-map',
    path: '/map',
    device: 'desktop',
    fullPage: false,
    waitMs: 4000,  // Leaflet タイル読込待ち
  },
  {
    name: 'desktop-accounts',
    path: '/accounts',
    device: 'desktop',
    fullPage: true,
    waitMs: 1500,
  },
  {
    name: 'desktop-account-detail',
    path: '/accounts/acc-005',
    device: 'desktop',
    fullPage: true,
    waitMs: 1500,
  },
  {
    name: 'desktop-visit-detail',
    path: '/visits/vis-001',
    device: 'desktop',
    fullPage: true,
    waitMs: 1500,
  },
  {
    name: 'desktop-visit-record',
    path: '/visits/vis-014/record',
    device: 'desktop',
    fullPage: true,
    waitMs: 1500,
  },
  {
    name: 'desktop-route-today',
    path: '/route-plans/today',
    device: 'desktop',
    fullPage: false,
    waitMs: 1500,
  },
  {
    name: 'desktop-admin',
    path: '/admin',
    device: 'desktop',
    fullPage: true,
    waitMs: 1500,
  },
];

async function shoot(ctx, page, p) {
  const url = `${BASE_URL.replace(/\/$/, '')}${p.path}`;
  console.log(`  → ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(p.waitMs || 500);

  if (p.actions) {
    for (const a of p.actions) {
      if (a.click) {
        const el = page.locator(a.click).first();
        if (await el.isVisible().catch(() => false)) {
          await el.click();
          await page.waitForTimeout(500);
        }
      }
      if (a.wait) await page.waitForTimeout(a.wait);
    }
  }

  const file = path.join(OUT_DIR, `${p.name}.png`);
  await page.screenshot({ path: file, fullPage: !!p.fullPage });
  console.log(`  ✓ ${p.name}.png`);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log(`[base] ${BASE_URL}`);
  const browser = await chromium.launch();

  const mobileCtx = await browser.newContext({
    viewport: MOBILE_VP,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  const desktopCtx = await browser.newContext({
    viewport: DESKTOP_VP,
    deviceScaleFactor: 2,
  });

  for (const p of PAGES) {
    const ctx = p.device === 'mobile' ? mobileCtx : desktopCtx;
    const page = await ctx.newPage();
    try {
      await shoot(ctx, page, p);
    } catch (e) {
      console.error(`  ✗ ${p.name}: ${e.message}`);
    } finally {
      await page.close();
    }
  }

  await mobileCtx.close();
  await desktopCtx.close();
  await browser.close();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
