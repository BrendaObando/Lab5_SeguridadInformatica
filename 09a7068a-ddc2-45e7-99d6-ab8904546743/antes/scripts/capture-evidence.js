const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { createChatServer } = require('../server');

const outputDir = path.join(__dirname, '..', 'evidencias');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function send(page, text) {
  await page.getByLabel('Username').fill('Evidencia');
  await page.getByLabel('Escriba un mensaje').fill(text);
  await page.getByRole('button', { name: 'Send' }).click();
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const { server, io } = createChatServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page.goto(url);
    await send(page, "<script>alert('Inyección de script')</script>");
    await page.waitForSelector('#messages li');
    await page.screenshot({ path: path.join(outputDir, 'evidencia-1-inyeccion-bloqueada.jpg'), fullPage: true, quality: 90 });

    await send(page, 'https://placehold.co/120x80.png');
    await send(page, 'https://youtu.be/qYwlqx-JLok');
    await page.waitForSelector('iframe[title="Video de YouTube compartido en el chat"]');
    await page.screenshot({ path: path.join(outputDir, 'funcionalidad-url-segura.jpg'), fullPage: true, quality: 90 });
  } finally {
    await browser.close();
    await new Promise((resolve) => io.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
