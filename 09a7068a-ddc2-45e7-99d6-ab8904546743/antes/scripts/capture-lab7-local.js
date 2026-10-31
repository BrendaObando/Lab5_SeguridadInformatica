const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { createChatServer } = require('../server');

(async () => {
  const output = path.join(__dirname, '..', 'evidencias', 'lab7');
  fs.mkdirSync(output, { recursive: true });
  const { server, io } = createChatServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url);
    await page.getByLabel('Tu nombre').fill('Prueba laboratorio 7');
    for (const message of ['Prueba funcional local con la integración de Sentry instalada.', 'Segundo mensaje de verificación.', '<script>texto seguro</script>']) {
      await page.getByLabel('Mensaje', { exact: true }).fill(message);
      await page.getByRole('button', { name: 'Enviar' }).click();
      await page.getByText(message, { exact: true }).waitFor();
    }
    await page.screenshot({ path: path.join(output, 'chat-local-sentry-instalado.png'), fullPage: true });
    const record = { capturedAt: new Date().toISOString(), url, environment: 'local', sentryCloudVerified: false, messages: await page.locator('#messages li').count(), screenshot: 'chat-local-sentry-instalado.png' };
    fs.writeFileSync(path.join(output, 'chat-local-capture.json'), JSON.stringify(record, null, 2));
    console.log(JSON.stringify(record, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => io.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
