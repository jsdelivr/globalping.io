const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test('Network page', async ({ page }) => {
	let response = await page.goto('/network');
	expect(response.ok()).toBeTruthy();

	// check that GMaps rendered
	await expect(page.locator('#gp-map > div > div.gm-style')).toBeVisible();

	// test probe filter interactions
	let autocomplete = await page.getByTestId('autocomplete-input');
	await expect(autocomplete).toBeVisible();
	await expect(autocomplete).toHaveValue('World');

	let probeCards = await page.getByTestId('probe-single-card');
	let probeColumnGroups = await page.getByTestId('probe-column-group');

	await expect(probeCards).toHaveCount(0);
	await expect(probeColumnGroups).not.toHaveCount(0);

	let quickFilterEurope = await page.getByTestId('quick-filter-Europe');
	await expect(quickFilterEurope).toBeVisible();
	await quickFilterEurope.click();
	await expect(autocomplete).toHaveValue('Europe');

	await autocomplete.click();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(autocomplete).toHaveValue(/.*Europe.*/);

	await autocomplete.fill('');
	await page.keyboard.press('Enter');

	let quickFilterEyeball = await page.getByTestId('quick-filter-datacenter');
	await quickFilterEurope.click();
	await quickFilterEyeball.click();
	await expect(autocomplete).toHaveValue('Europe+datacenter-network');

	let groupBySelect = await page.getByTestId('group-by-select');
	await expect(groupBySelect).toBeVisible();
	await expect(groupBySelect).toContainText('City + Network');
	let groupByOptions = await page.getByTestId('group-by-select-options');
	await expect(groupByOptions).not.toBeVisible();
	await groupBySelect.click();
	await expect(groupByOptions).toBeVisible();
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('Enter');

	await expect(groupBySelect).toContainText('City');
	await expect(groupBySelect).not.toContainText('Network');
	await expect(groupByOptions).not.toBeVisible();
	await expect(page).toHaveURL('network?filter=Europe%25datacenter-network&group=city');

	let sortBySelect = await page.getByTestId('sort-by-select');
	await expect(sortBySelect).toBeVisible();
	await expect(sortBySelect).toContainText('Alphabetically');
	await sortBySelect.click();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(sortBySelect).toContainText('Probe count');
	await expect(page).toHaveURL('network?filter=Europe%25datacenter-network&group=city&sort=probe-count');

	await groupBySelect.click();
	let disabledOpt = page.getByTestId('select-option-disabled');
	await expect(disabledOpt).toBeVisible();
	await disabledOpt.click();
	await expect(sortBySelect).toBeDisabled();
	await expect(page).toHaveURL('network?filter=Europe%25datacenter-network&group=disabled');

	probeCards = await page.getByTestId('probe-single-card');
	probeColumnGroups = await page.getByTestId('probe-column-group');

	await expect(probeCards).not.toHaveCount(0);
	await expect(probeColumnGroups).toHaveCount(0);

	await page.goto('/network?group=country&filter=South%20America&sort=probe-count');
	await expect(groupBySelect).toContainText('Country');
	await expect(groupBySelect).not.toContainText('Network');
	await expect(sortBySelect).toContainText('Probe count');
	await expect(autocomplete).toHaveValue('South America');
});
