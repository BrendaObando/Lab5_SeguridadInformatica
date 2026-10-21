const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e', timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:3100', screenshot: 'only-on-failure' },
  webServer: { command: 'set PORT=3100&& node server.js', url: 'http://127.0.0.1:3100', reuseExistingServer: false },
  // Chrome ya está instalado en el equipo del laboratorio; se usa como navegador Chromium.
  projects: [{ name: 'chromium', use: { browserName: 'chromium', launchOptions: { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' } } }],
});
