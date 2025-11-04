const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

const test404PageContent = async (page) => {
	await expect(page.getByText('Oops! The page you were looking for doesn’t exist.')).toBeVisible();

	let goBackLink = page.getByRole('link', { name: 'Back to Homepage' });
	await expect(goBackLink).toBeVisible();

	let href = await goBackLink.getAttribute('href');
	await expect(href).toEqual('/');
};

test('404 page', async ({ page }) => {
	let response = await page.goto('/404');
	expect(response.status()).toEqual(404);
	await test404PageContent(page);
});

test('Invalid user', async ({ page }) => {
	let response = await page.goto('/users/nonexistent-user-xxxxxxxx');
	expect(response.status()).toEqual(404);
	await test404PageContent(page);
});

test('Invalid network', async ({ page }) => {
	let response = await page.goto('/networks/nonexistent-network-xxxxxxxx');
	expect(response.status()).toEqual(404);
	await test404PageContent(page);
});

test('Invalid docs', async ({ page }) => {
	let response = await page.goto('/docs/nonexistent');
	expect(response.status()).toEqual(404);
	await test404PageContent(page);
});

test('Empty user', async ({ page }) => {
	let response = await page.goto('/users/');
	expect(response.status()).toEqual(404);
	await test404PageContent(page);
});

test('Empty network', async ({ page }) => {
	let response = await page.goto('/networks/');
	expect(response.status()).toEqual(404);
	await test404PageContent(page);
});

test('Empty docs', async ({ page }) => {
	let response = await page.goto('/docs/');
	expect(response.status()).toEqual(404);
	await test404PageContent(page);
});

test('Nonexistent page', async ({ page }) => {
	let response = await page.goto('/nonexistent-page');
	expect(response.status()).toEqual(404);
	await test404PageContent(page);
});

