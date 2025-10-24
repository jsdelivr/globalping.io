const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Discord page', async ({ page }) => {
	let response = await page.goto('/discord');
	expect(response.ok()).toBeTruthy();

	// no special interactions to be tested here, just check that the HTML rendered
	await expect(page.getByText('Globalping Integration for Discord Quick Start').first()).toBeVisible();
});

