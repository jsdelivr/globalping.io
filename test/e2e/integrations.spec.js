const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Integrations page', async ({ page }) => {
	let response = await page.goto('/integrations');
	expect(response.ok()).toBeTruthy();

	// check headers are rendered
	await expect(page.getByRole('heading', { name: 'Globalping Integrations' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Community Integrations' })).toBeVisible();

	// count community integrations
	let communityContainer = page.getByTestId('community-tiles');
	let communityTiles = communityContainer.getByTestId('integration-tile');
	let communityTileCount = await communityTiles.count();

	await expect(communityTileCount).toBeGreaterThan(0);

	// allTiles = community + official integrations
	let allTiles = page.getByTestId('integration-tile');
	await expect(allTiles.count()).resolves.toBeGreaterThan(communityTileCount);
});
