const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Leaderboard page', async ({ page }) => {
	let response = await page.goto('/leaderboard');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Most hosted probes' })).toBeVisible();

	let tableRows = page.locator('tbody tr');
	await expect(tableRows).not.toHaveCount(1);

	let firstCellLocator = page.locator('tbody tr').first().locator('td').first();
	let initialFirstItemText = await firstCellLocator.innerText();

	let paginatedResponse = await page.goto('/leaderboard?page=2');
	expect(paginatedResponse.ok()).toBeTruthy();

	let newFirstItemText = await firstCellLocator.innerText();
	expect(newFirstItemText).not.toEqual(initialFirstItemText);

	await expect(tableRows).toHaveCount(100);
});
