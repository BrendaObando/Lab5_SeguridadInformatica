const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('@playwright/test');

async function main() {
  const root = path.join(__dirname, '..');
  const output = path.join(root, 'evidencias', 'lab7');
  const id = execFileSync('docker', ['compose', 'ps', '-q', 'chat'], { cwd: root, encoding: 'utf8', timeout: 30000 }).trim();
  assert.match(id, /^[a-f0-9]{12,64}$/);
  const info = JSON.parse(execFileSync('docker', ['inspect', id], { encoding: 'utf8', timeout: 30000 }))[0];
  assert.equal(info.State.Running, true);
  assert.ok(info.NetworkSettings.Ports['3000/tcp'].some((binding) => binding.HostIp === '127.0.0.1' && binding.HostPort === '3000'));
  const url = 'http://127.0.0.1:3000/';
  const startedAt = new Date().toISOString();
  const available = await fetch(url, { signal: AbortSignal.timeout(15000) });
  assert.equal(available.status, 200);
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url);
    await page.getByLabel('Tu nombre').fill('Prueba Docker laboratorio 7');
    for (const message of ['Mensaje funcional desde Docker local.', 'Segunda respuesta del contenedor.', '<script>texto seguro en Docker</script>']) {
      await page.getByLabel('Mensaje', { exact: true }).fill(message);
      await page.getByRole('button', { name: 'Enviar' }).click();
      await page.getByText(message, { exact: true }).waitFor();
    }
    const response = await fetch(`${url}api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'HTTP local', mensaje: 'Mensaje HTTP procesado por el contenedor.' }), signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200);
    await page.getByText('Mensaje HTTP procesado por el contenedor.', { exact: true }).waitFor();
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'chat-docker-local.png'), fullPage: true });
    const record = {
      startedAt, finishedAt: new Date().toISOString(), url,
      containerId: id, imageId: info.Image, containerRunning: true,
      publishedAddress: '127.0.0.1:3000',
      httpStatus: available.status, messageApiStatus: response.status,
      messagesVisible: await page.locator('#messages li').count(),
      grafanaCloudVerified: false,
      screenshot: 'chat-docker-local.png', status: 'PASS',
    };
    fs.writeFileSync(path.join(output, 'docker-functional-verification.json'), JSON.stringify(record, null, 2));
    console.log(JSON.stringify(record, null, 2));
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
