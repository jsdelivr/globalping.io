const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('User page', async ({ page }) => {
	let response = await page.goto('/users/jimaek');
	expect(response.ok()).toBeTruthy();

	// check that the page and GMaps rendered
	await expect(page.locator('#gp-map > div > div.gm-style')).toBeVisible();
	await expect(page.locator('img[src="https://github.com/jimaek.png"]')).toBeVisible();
	let username = page.getByText('jimaek');
	await expect(username.count()).resolves.toBeGreaterThan(0);

	// test filters
	let autocomplete = await page.getByTestId('autocomplete-input');
	await expect(autocomplete).toBeVisible();
	await expect(autocomplete).toHaveValue('World');

	let groupBySelect = await page.getByTestId('group-by-select');
	await expect(groupBySelect).toBeVisible();
	await expect(groupBySelect).toContainText('Disabled');

	let sortBySelect = await page.getByTestId('sort-by-select');
	await expect(sortBySelect).toBeVisible();
	await expect(sortBySelect).toContainText('Alphabetically');
	await expect(sortBySelect).toBeDisabled();

	await expect(page).toHaveURL('users/jimaek');

	await groupBySelect.click();
	let countryOpt = page.getByTestId('select-option-country');
	await countryOpt.click();

	await expect(sortBySelect).not.toBeDisabled();
	await sortBySelect.click();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(sortBySelect).not.toContainText('Alphabetically');

	await autocomplete.fill('Europe');
	await autocomplete.press('Enter');
	await expect(autocomplete).toHaveValue('Europe');

	await expect(page).toHaveURL('users/jimaek?group=country&sort=probe-count&filter=Europe');

	// reset filters
	await page.goto('/users/jimaek');
	await expect(autocomplete).toHaveValue('World');
	await expect(groupBySelect).toContainText('Disabled');
	await expect(sortBySelect).toContainText('Alphabetically');
	await expect(sortBySelect).toBeDisabled();

	// load params from url
	await page.goto('/users/jimaek?group=network&filter=datacenter-network&sort=probe-count');
	await expect(groupBySelect).toContainText('Network');
	await expect(sortBySelect).not.toContainText('+');
	await expect(sortBySelect).toContainText('Probe count');
	await expect(sortBySelect).not.toBeDisabled();
	await expect(autocomplete).toHaveValue('datacenter-network');
});
