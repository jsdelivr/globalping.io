const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Leaderboards page', async ({ page }) => {
	let response = await page.goto('/leaderboards');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByRole('heading', { name: 'Leaderboards' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Most hosted probes' })).toBeVisible();

	let tableRows = page.locator('tbody tr');
	await expect(tableRows).not.toHaveCount(1);

	let firstCellLocator = page.locator('tbody tr').first().locator('td').first();
	let initialFirstItemText = await firstCellLocator.innerText();

	let paginatedResponse = await page.goto('/leaderboards?page=2');
	expect(paginatedResponse.ok()).toBeTruthy();

	let newFirstItemText = await firstCellLocator.innerText();
	expect(newFirstItemText).not.toEqual(initialFirstItemText);

	await expect(tableRows).toHaveCount(100);
});
