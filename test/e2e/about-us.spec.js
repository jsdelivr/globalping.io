const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('About us page', async ({ page }) => {
	let response = await page.goto('/about-us');
	expect(response.ok()).toBeTruthy();

	// no special interactions to be tested here, just check that the HTML rendered
	await expect(page.getByText('Globalping A globally distributed network of probes or network vantage points')).toBeVisible();
});
