const { test, expect } = require('@playwright/test');

module.exports.test = test.extend({
	forEachTest: [ async ({ page }, use) => {
		// save the response status from the last navigation request
		let lastStatus = null;

		page.on('response', (res) => {
			let req = res.request();

			if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
				lastStatus = res.status();
			}
		});

		// run tests
		await use();

		// check that header and footer are visible (on GP pages that should have them)
		if (page.url().includes('/docs') || page.url().includes('https://')) {
			return;
		}

		await expect(page.locator('header')).toBeVisible();

		if (lastStatus === 404) {
			return;
		}

		await expect(page.locator('footer')).toBeVisible();
	}, { auto: true }],
});
