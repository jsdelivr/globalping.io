const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Integrations page', async ({ page }) => {
	let response = await page.goto('/integrations');
	expect(response.ok()).toBeTruthy();

	// check headers are rendered
	await expect(page.getByText('Globalping Integrations')).toBeVisible();
	await expect(page.getByText('Community Integrations')).toBeVisible();

	// count community integrations
	let communityContainer = page.getByTestId('c-tiles-community');
	let communityTiles = communityContainer.getByTestId('c-tile');
	let communityTileCount = await communityTiles.count();

	await expect(communityTileCount).toBeGreaterThan(0);

	// allTiles = community + official integrations
	let allTiles = page.getByTestId('c-tile');
	await expect(allTiles.count()).resolves.toBeGreaterThan(communityTileCount);
});
