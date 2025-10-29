const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

const testLinkVisibility = async (page) => {
	// test navigation links visibility
	let termsLink = page.getByTestId('terms-of-use');
	let privacyLink = page.getByTestId('privacy-policy');
	let cookieLink = page.getByTestId('cookie-policy');

	await expect(privacyLink).toBeVisible();
	await expect(cookieLink).toBeVisible();
	await expect(termsLink).toBeVisible();
};

const testLinkSelection = async (page, selected) => {
	// test that the selected link is highlighted
	let tags = [ 'terms-of-use', 'privacy-policy', 'cookie-policy' ];
	let unselected = tags.filter(tag => tag !== selected);

	await expect(page.getByTestId(selected)).toHaveClass('active');

	for (let tag of unselected) {
		await expect(page.getByTestId(tag)).not.toHaveClass('active');
	}
};

test('Terms root page', async ({ page }) => {
	let response = await page.goto('/terms');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByRole('heading', { name: 'Terms & Policies' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible();

	await testLinkVisibility(page);
	await testLinkSelection(page, 'terms-of-use');

	// test navigation between subpages
	let termsLink = await page.getByTestId('terms-of-use');
	let privacyLink = await page.getByTestId('privacy-policy');
	let cookieLink = await page.getByTestId('cookie-policy');

	await privacyLink.click();
	await expect(page).toHaveURL('/terms/privacy-policy');

	await cookieLink.click();
	await expect(page).toHaveURL('/terms/cookie-policy');

	await termsLink.click();
	await expect(page).toHaveURL('/terms/terms-of-use');
});

test('Terms of use page', async ({ page }) => {
	let response = await page.goto('/terms/terms-of-use');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByRole('heading', { name: 'Terms & Policies' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible();
	await testLinkVisibility(page);
	await testLinkSelection(page, 'terms-of-use');
});

test('Privacy policy page', async ({ page }) => {
	let response = await page.goto('/terms/privacy-policy');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByRole('heading', { name: 'Terms & Policies' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
	await testLinkVisibility(page);
	await testLinkSelection(page, 'privacy-policy');
});

test('Cookie policy page', async ({ page }) => {
	let response = await page.goto('/terms/cookie-policy');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByRole('heading', { name: 'Terms & Policies' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Cookie Policy' })).toBeVisible();
	await testLinkVisibility(page);
	await testLinkSelection(page, 'cookie-policy');
});

