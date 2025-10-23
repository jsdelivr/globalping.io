const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Networks page', async ({ page }) => {
	let response = await page.goto('/networks/orange');
	expect(response.ok()).toBeTruthy();

	// test that GMaps rendered
	await expect(page.locator('#gp-map > div > div.gm-style')).toBeVisible();

	// test that the page header and Logo dev link are rendered
	await expect(page.getByRole('heading', { name: 'Looking Glass - Orange' })).toBeVisible();
	let link = page.getByTestId('logo-dev-link');
	await expect(link).toBeVisible();
	await expect(link).toHaveAttribute('href', 'https://logo.dev');

	// try running a test
	let runTestButton = page.getByTestId('networks-run-test-btn');
	await expect(runTestButton).toBeVisible();
	await expect(runTestButton).toBeEnabled();

	let testPlaceholder = page.getByTestId('networks-test-placeholder');
	await expect(testPlaceholder).toBeVisible();

	await runTestButton.click();

	await expect(testPlaceholder).not.toBeVisible();
	await expect(page.getByTestId('networks-test-output')).toBeVisible();

	// there should be at least one other network
	let otherNetwork = page.getByTestId('other-network');
	await expect(otherNetwork).not.toHaveCount(0);
});
