const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Sponsors page', async ({ page }) => {
	let response = await page.goto('/sponsors');
	expect(response.ok()).toBeTruthy();

	// no special interactions to be tested here, just check that the HTML rendered
	await expect(page.getByRole('heading', { name: 'Our Sponsors' })).toBeVisible();
});
