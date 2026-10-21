const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const root = path.join(__dirname, '..');
const evidence = path.join(root, 'evidencias');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const reports = [
  ['Evidencia 2 - Pruebas unitarias con Mocha', 'resultado-unitarias.txt', 'evidencia-2-unitarias.jpg'],
  ['Evidencia 3 - Pruebas de integracion con Jest y Socket.IO', 'resultado-integracion.txt', 'evidencia-3-integracion.jpg'],
  ['Evidencia 4 - Pruebas end to end con Playwright en modo visible', 'resultado-e2e.txt', 'evidencia-4-e2e.jpg'],
];

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    for (const [title, source, destination] of reports) {
      const result = fs.readFileSync(path.join(evidence, source), 'utf8');
      await page.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8"><style>body{margin:36px;background:#f7f7f7;font-family:Arial;color:#111}h1{font-size:24px;margin:0 0 20px}p{font-size:14px;color:#444}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#121212;color:#e8e8e8;border-radius:8px;padding:24px;font:16px/1.5 Consolas,monospace;box-shadow:0 2px 7px #aaa}</style></head><body><h1>${title}</h1><p>Salida real de la ejecucion registrada para el laboratorio.</p><pre></pre></body></html>`);
      await page.locator('pre').evaluate((element, text) => { element.textContent = text; }, result);
      await page.screenshot({ path: path.join(evidence, destination), fullPage: true, quality: 90 });
    }
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
