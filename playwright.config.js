const { defineConfig, devices } = require('@playwright/test');
const config = require('config');
const BASE_URL = `http://localhost:${config.get('server').port}`;

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
	testDir: './test/e2e',
	outputDir: './test/e2e/results',
	workers: 1,
	forbidOnly: !!process.env.CI,
	reporter: 'list',
	use: {
		baseURL: BASE_URL,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'node src',
		url: BASE_URL,
		reuseExistingServer: !process.env.CI,
	},
});
