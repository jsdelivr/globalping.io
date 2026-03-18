const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Providers page', async ({ page }) => {
	let response = await page.goto('/providers');
	expect(response.ok()).toBeTruthy();

	let providersHeader = page.getByRole('heading', { name: 'Providers', exact: true });
	let largestProvidersHeader = page.getByRole('heading', { name: 'Largest providers', exact: true });
	let localProvidersHeader = page.getByRole('heading', { name: 'Local providers', exact: true });
	await expect(providersHeader).toBeVisible();
	await expect(largestProvidersHeader).toBeVisible();
	await expect(localProvidersHeader).toBeVisible();

	// test probe filter interactions
	let autocomplete = await page.getByTestId('autocomplete-input');
	await expect(autocomplete).toBeVisible();
	await expect(autocomplete).toHaveValue('World');

	let quickFilterEurope = await page.getByTestId('quick-filter-Europe');
	await expect(quickFilterEurope).toBeVisible();
	await quickFilterEurope.click();
	await expect(autocomplete).toHaveValue('Europe');

	await autocomplete.click();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(autocomplete).toHaveValue(/.*Europe.*/);

	let sortBySelect = await page.getByTestId('sort-by-select');
	await expect(sortBySelect).toBeVisible();
	await expect(sortBySelect).toContainText('Probe count');
	await sortBySelect.click();
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('Enter');
	await expect(sortBySelect).toContainText('Alphabetically');
	await expect(page).toHaveURL('providers?filter=Western%20Europe&sort=alphabetically');

	let hetznerProvider = page.getByRole('heading', { name: 'Hetzner' });
	await expect(hetznerProvider).toBeVisible();

	let westernEuropeCount = await page.getByText('probes in Western Europe').count();
	expect(westernEuropeCount).toBeGreaterThan(0);
});
