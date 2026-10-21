const { test, expect } = require('@playwright/test');

async function sendMessage(page, message) {
  await page.getByLabel('Username').fill('Evidencia');
  await page.getByLabel('Escriba un mensaje').fill(message);
  await page.getByRole('button', { name: 'Send' }).click();
}

test.beforeEach(async ({ page }) => page.goto('/'));

test('muestra una imagen válida en el chat', async ({ page }) => {
  await sendMessage(page, 'https://placehold.co/120x80.png');
  const image = page.getByAltText('Imagen compartida en el chat');
  await expect(image).toHaveAttribute('src', 'https://placehold.co/120x80.png');
  await expect(image).toBeVisible();
  await expect(image).toHaveJSProperty('complete', true);
  expect(await image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
});

test('muestra el reproductor para un video válido de YouTube', async ({ page }) => {
  await sendMessage(page, 'https://youtu.be/qYwlqx-JLok');
  const frame = page.getByTitle('Video de YouTube compartido en el chat');
  await expect(frame).toHaveAttribute('src', 'https://www.youtube.com/embed/qYwlqx-JLok');
  await expect(frame).toBeVisible();
  await expect.poll(() => page.frames().map((childFrame) => childFrame.url()).join('\n')).toContain('youtube.com/embed/qYwlqx-JLok');
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
