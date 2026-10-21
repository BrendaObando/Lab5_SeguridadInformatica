const { test, expect } = require('@playwright/test');

async function sendMessage(page, message) {
  await page.getByLabel('Username').fill('Evidencia');
  await page.getByLabel('Escriba un mensaje').fill(message);
  await page.getByRole('button', { name: 'Send' }).click();
}

test.beforeEach(async ({ page }) => page.goto('/'));

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('muestra una imagen válida y adaptable en el chat', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await sendMessage(page, 'https://placehold.co/120x80.png');
  const image = page.getByAltText('Imagen compartida en el chat');
  await expect(image).toHaveAttribute('src', 'https://placehold.co/120x80.png');
  await expect(image).toBeVisible();
  await expect(image).toHaveJSProperty('complete', true);
  expect(await image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  await expectNoHorizontalOverflow(page);
});

test('muestra un reproductor de video adaptable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await sendMessage(page, 'https://youtu.be/qYwlqx-JLok');
  const frame = page.getByTitle('Video de YouTube compartido en el chat');
  await expect(frame).toHaveAttribute('src', 'https://www.youtube.com/embed/qYwlqx-JLok');
  await expect(frame).toBeVisible();
  await expect.poll(() => page.frames().map((childFrame) => childFrame.url()).join('\n')).toContain('youtube.com/embed/qYwlqx-JLok');
  await expectNoHorizontalOverflow(page);
});

test('ajusta un mensaje de texto largo al ancho disponible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const message = 'mensaje-largo-'.repeat(40);
  await sendMessage(page, message);
  await expect(page.locator('.message-text')).toHaveText(message);
  await expectNoHorizontalOverflow(page);
});

test('avisa sobre un enlace no permitido sin incrustarlo', async ({ page }) => {
  await sendMessage(page, 'https://example.com/articulo');
  await expect(page.locator('.message-text')).toHaveText('https://example.com/articulo');
  await expect(page.getByRole('status')).toHaveText('Este enlace no está permitido para vista previa.');
  await expect(page.locator('#messages img, #messages iframe, #messages a')).toHaveCount(0);
});

test('no abre un alert ni interpreta scripts enviados por el usuario', async ({ page }) => {
  let dialogOpened = false;
  page.on('dialog', (dialog) => { dialogOpened = true; dialog.dismiss(); });
  const payload = "<script>alert('Inyección de script')</script>";
  await sendMessage(page, payload);
  await expect(page.locator('#messages li')).toContainText(payload);
  await expect(page.locator('#messages script')).toHaveCount(0);
  await page.waitForTimeout(250);
  expect(dialogOpened).toBe(false);
});
