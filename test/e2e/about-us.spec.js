const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('About us page', async ({ page }) => {
	let response = await page.goto('/about-us');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByRole('heading', { level: 1, name: 'Globalping' })).toBeVisible();
	await expect(page.getByText('A globally distributed network of probes or network vantage points.')).toBeVisible();
	await expect(page.getByText('Globalping in numbers')).toBeVisible();
});
