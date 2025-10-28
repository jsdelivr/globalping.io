const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Credits page', async ({ page }) => {
	let response = await page.goto('/credits');
	expect(response.ok()).toBeTruthy();

	// check that all headers are rendered
	await expect(page.getByRole('heading', { name: 'Globalping limits and credits' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Become a sponsor' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Host a probe' })).toBeVisible();

	// test donation type switch
	let donationSwitch = page.locator('.payment-type-select');
	await expect(donationSwitch).toBeVisible();

	let oneTimeDonation = page.locator('.one-time-donation');
	let monthlyDonation = page.locator('.monthly-donation');

	await expect(oneTimeDonation).not.toBeVisible();
	await expect(monthlyDonation).toBeVisible();

	await donationSwitch.click();

	await expect(oneTimeDonation).toBeVisible();
	await expect(monthlyDonation).not.toBeVisible();
});
