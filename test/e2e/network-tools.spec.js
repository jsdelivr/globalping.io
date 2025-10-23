const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

const runTest = async (page, type, target) => {
	// test that a measurement can be started and finishes
	await expect(page.getByTestId('network-tools-description')).toBeVisible();

	let runBtn = page.getByTestId('network-tools-run-test-btn');
	await expect(runBtn).toBeVisible();
	await expect(runBtn).toBeEnabled();

	if (target) {
		let input = page.locator('#targetInput');
		await input.fill(target);
	}

	let results = page.getByTestId('results-raw-output');
	await expect(results).not.toBeVisible();

	await runBtn.click();
	await expect(results).toBeVisible();
};

test('Network tools page', async ({ page }) => {
	let response = await page.goto('/network-tools');
	expect(response.ok()).toBeTruthy();
	await expect(page).toHaveURL('network-tools/ping-from-world');
});

test('Network tools - ping from world page', async ({ page }) => {
	let response = await page.goto('/network-tools/ping-from-world');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByText('Ping from multiple locations in World')).toBeVisible();
	await runTest(page);
});

test('Network tools - traceroute from US', async ({ page }) => {
	let response = await page.goto('/network-tools/traceroute-from-united-states');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByText('Traceroute from multiple locations in United States')).toBeVisible();
	await runTest(page, 'www.google.com');
});

test('Network tools - DNS from Europe', async ({ page }) => {
	let response = await page.goto('/network-tools/dns-from-europe');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByText('DNS resolve from multiple locations in Europe')).toBeVisible();
	await runTest(page);
});

test('Network tools - HTTP from AWS', async ({ page }) => {
	let response = await page.goto('/network-tools/http-from-amazoncom');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByText('HTTP from multiple locations in Amazon.com')).toBeVisible();
	await runTest(page, 'amazon.com');
});
