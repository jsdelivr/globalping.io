const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('API docs page', async ({ page }) => {
	let response = await page.goto('/docs/api.globalping.io');
	expect(response.ok()).toBeTruthy();

	// check that the HTML rendered and openapi spec link is present
	await expect(page.getByText('Globalping API').first()).toBeVisible();

	let openApiLink = page.getByRole('button', { name: 'Download OpenAPI spec' });
	await expect(openApiLink).toBeVisible();
	await openApiLink.click();
	await expect(page.url()).toEqual('https://api.globalping.io/v1/spec.yaml');

	// cannot test much more as RapiDoc renders docs
});

test('Auth API docs page', async ({ page }) => {
	let response = await page.goto('/docs/auth.globalping.io');
	expect(response.ok()).toBeTruthy();

	// check that the HTML rendered and openapi spec link is present
	await expect(page.getByText('Globalping Auth API').first()).toBeVisible();

	let openApiLink = page.getByRole('button', { name: 'Download OpenAPI spec' });
	await expect(openApiLink).toBeVisible();
	await openApiLink.click();
	await expect(page.url()).toEqual('https://auth.globalping.io/spec.yaml');

	// cannot test much more as RapiDoc renders docs
});
