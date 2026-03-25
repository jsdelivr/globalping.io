const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Network providers page', async ({ page }) => {
	let response = await page.goto('/network-providers');
	expect(response.ok()).toBeTruthy();

	let providersHeader = page.getByRole('heading', { name: 'Network providers', exact: true });
	let largestProvidersHeader = page.getByRole('heading', { name: 'Largest providers', exact: true });
	let allProvidersHeader = page.getByRole('heading', { name: 'All providers', exact: true });
	await expect(providersHeader).toBeVisible();
	await expect(largestProvidersHeader).toBeVisible();
	await expect(allProvidersHeader).toBeVisible();

	// test probe filter interactions
	let autocomplete = page.getByTestId('autocomplete-input');
	await expect(autocomplete).toBeVisible();
	await expect(autocomplete).toHaveValue('World');

	let quickFilterEurope = page.getByTestId('quick-filter-Europe');
	await expect(quickFilterEurope).toBeVisible();
	await quickFilterEurope.click();
	await expect(autocomplete).toHaveValue('Europe');

	await autocomplete.click();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(autocomplete).toHaveValue('Western Europe');

	let sortBySelect = page.getByTestId('sort-by-select');
	await expect(sortBySelect).toBeVisible();
	await expect(sortBySelect).toContainText('Location count');
	await sortBySelect.click();
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('Enter');
	await expect(sortBySelect).toContainText('Alphabetically');
	await expect(page).toHaveURL('network-providers?filter=Western%20Europe&sort=alphabetically');
	await expect(page.getByText('matching locations').first()).toBeVisible();
});
