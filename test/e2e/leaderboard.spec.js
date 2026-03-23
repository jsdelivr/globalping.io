const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Leaderboard page', async ({ page }) => {
	let response = await page.goto('/leaderboard');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Most hosted probes' })).toBeVisible();

	let tableRows = page.locator('tbody tr:not(.loading-skeleton)');
	await expect(tableRows).toHaveCount(100);

	let firstCellLocator = page.locator('tbody tr').first().locator('td').first();
	let initialFirstItemText = await firstCellLocator.innerText();

	let paginatedResponse = await page.goto('/leaderboard?page=2');
	expect(paginatedResponse.ok()).toBeTruthy();

	await expect(tableRows.first()).toBeVisible();
	await expect(firstCellLocator).not.toHaveText(initialFirstItemText);
	await expect(tableRows).toHaveCount(100);
});
