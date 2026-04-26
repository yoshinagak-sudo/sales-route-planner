// docs/OVERVIEW.md → docs/OVERVIEW.pdf
//
// 使い方:
//   node scripts/build-pdf.js
//
// 依存: marked, playwright（@dev）

const { chromium } = require('playwright');
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MD_PATH = path.join(ROOT, 'docs', 'OVERVIEW.md');
const HTML_PATH = path.join(ROOT, 'docs', 'OVERVIEW.html');
const PDF_PATH = path.join(ROOT, 'docs', 'OVERVIEW.pdf');

const css = `
:root {
  --brand: #2F6B3D;
  --brand-dark: #1E4A2A;
  --accent: #E8A83A;
  --danger: #C23B22;
  --bg: #F7F6F1;
  --fg: #1f1f1d;
  --muted: #6b6b65;
  --border: #e6e3da;
  --card: #ffffff;
}
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", system-ui, -apple-system, sans-serif;
  font-size: 10.5pt;
  line-height: 1.7;
  color: var(--fg);
  background: white;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 12px;
}
h1, h2, h3 { font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif; line-height: 1.4; }
h1 {
  font-size: 22pt;
  color: var(--brand);
  border-bottom: 3px solid var(--brand);
  padding-bottom: 6px;
  margin: 0 0 6px 0;
  page-break-after: avoid;
}
h2 {
  font-size: 14pt;
  color: var(--brand-dark);
  margin: 28px 0 10px;
  padding-left: 10px;
  border-left: 4px solid var(--brand);
  page-break-after: avoid;
}
h3 {
  font-size: 12pt;
  color: var(--brand-dark);
  margin: 18px 0 6px;
  page-break-after: avoid;
}
p { margin: 6px 0 10px; }
ul, ol { margin: 6px 0 12px; padding-left: 22px; }
li { margin: 3px 0; }
strong { color: var(--brand-dark); font-weight: 700; }
em { color: var(--muted); }
hr { border: none; border-top: 1px dashed var(--border); margin: 18px 0; }
blockquote {
  background: #f3f1ea;
  border-left: 4px solid var(--accent);
  padding: 10px 14px;
  margin: 14px 0;
  border-radius: 4px;
  color: var(--muted);
  font-size: 10pt;
}
blockquote > p { margin: 0; }
table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 9.5pt;
}
th, td {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
  vertical-align: top;
}
th {
  background: var(--brand);
  color: white;
}
code { font-family: "JetBrains Mono", "Menlo", monospace; font-size: 9.5pt; background: #f3f1ea; padding: 1px 5px; border-radius: 3px; }
pre { background: #f3f1ea; padding: 10px 12px; border-radius: 6px; overflow-x: auto; }
img { max-width: 100%; border: 1px solid var(--border); border-radius: 6px; margin: 8px 0; page-break-inside: avoid; }
a { color: var(--brand); }
.tagline {
  background: linear-gradient(120deg, var(--brand) 0%, var(--brand-dark) 100%);
  color: white;
  padding: 10px 14px;
  border-radius: 8px;
  font-weight: 600;
  margin: 6px 0 16px;
}
.tagline a { color: var(--accent); }

/* 印刷時の改ページ制御 */
h2 { page-break-before: auto; }
img, table, blockquote { page-break-inside: avoid; }
`;

async function main() {
  if (!fs.existsSync(MD_PATH)) {
    console.error(`Not found: ${MD_PATH}`);
    process.exit(1);
  }

  const md = fs.readFileSync(MD_PATH, 'utf-8');
  const body = marked.parse(md);

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>営業訪問プランナー — サービス概要</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  <base href="file://${path.join(ROOT, 'docs')}/" />
  <style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;

  fs.writeFileSync(HTML_PATH, html);
  console.log(`✓ HTML: ${HTML_PATH}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + HTML_PATH, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '14mm',
      bottom: '14mm',
      left: '12mm',
      right: '12mm',
    },
  });

  await browser.close();
  const stat = fs.statSync(PDF_PATH);
  console.log(`✓ PDF:  ${PDF_PATH}  (${(stat.size / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
