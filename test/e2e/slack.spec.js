const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Slack page', async ({ page }) => {
	let response = await page.goto('/slack');
	expect(response.ok()).toBeTruthy();

	// no special interactions to be tested here, just check that the HTML rendered
	await expect(page.getByText('Globalping Integration for Slack Quick Start')).toBeVisible();
});
