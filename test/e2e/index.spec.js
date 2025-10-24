const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

const testAnchor = async (anchor, page, context) => {
	// test that all links lead to a valid page
	let href = await anchor.getAttribute('href');

	if (!href) {
		return;
	}

	if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
		return;
	}

	let url = new URL(href, page.url()).toString();

	let newPage = await context.newPage();
	let res = await newPage.goto(url);
	expect(res.ok()).toBeTruthy();
	await newPage.close();
};

test('Homepage', async ({ page, context }) => {
	let response = await page.goto('/');
	expect(response.ok()).toBeTruthy();

	// test that HTML and GMaps are rendered
	await expect(page.getByText('Monitor, debug and benchmark')).toBeVisible();
	await expect(page.locator('#gp-map > div > div.gm-style')).toBeVisible();

	// there should be at least one sponsor
	let sponsors = await page.getByTestId('gp-sponsors');
	await expect(sponsors.locator('a')).not.toHaveCount(0);

	// fill form link should work
	let fillFormLink = await page.getByRole('link', { name: 'Fill the form' });
	let href = await fillFormLink.getAttribute('href');
	let newPage = await context.newPage();
	let res = await newPage.goto(href);
	expect(res.ok()).toBeTruthy();
	await newPage.close();

	// try running a test and check URL query params
	let rawResults = page.getByTestId('results-raw-output');
	let tableResults = page.getByTestId('results-table-output');
	let displayControls = page.getByTestId('results-display-switch');
	let mapSwitch = page.getByTestId('map-switch');

	await expect(rawResults).not.toBeVisible();
	await expect(tableResults).not.toBeVisible();

	let testBtn = await page.getByTestId('run-test-btn');
	await expect(testBtn).toBeVisible();
	await expect(testBtn).toBeEnabled();
	await testBtn.click();

	await expect(rawResults).toBeVisible();
	await expect(tableResults).not.toBeVisible();
	let pageUrl = await page.url();
	await expect(pageUrl).toContain('measurement=');

	// test map/display controls
	await expect(displayControls).toBeVisible();
	await expect(mapSwitch).toBeVisible();
	await expect(pageUrl).not.toContain('map=');
	await expect(pageUrl).not.toContain('display=');

	await mapSwitch.click();
	await displayControls.click();

	await expect(rawResults).not.toBeVisible();
	await expect(tableResults).toBeVisible();
	await expect(page.locator('#gp-map > div > div.gm-style')).not.toBeVisible();

	pageUrl = await page.url();
	await expect(pageUrl).toContain('map=hidden');
	await expect(pageUrl).toContain('display=table');

	// test that the site accepts URL params on load
	await page.goto('/');
	await page.goto(pageUrl);
	await expect(rawResults).not.toBeVisible();
	await expect(tableResults).toBeVisible();
	await expect(page.locator('#gp-map > div > div.gm-style')).not.toBeVisible();
});

test('Header', async ({ page, context }) => {
	await page.goto('/');
	await expect(page.locator('header')).toBeVisible();

	let anchors = page.locator('header a[href]');
	let anchorCount = await anchors.count();

	for (let i = 0; i < anchorCount; i++) {
		await testAnchor(anchors.nth(i), page, context);
	}
});

test('Footer', async ({ page, context }) => {
	await page.goto('/');
	await expect(page.locator('footer')).toBeVisible();

	let anchors = page.locator('footer a[href]');
	let anchorCount = await anchors.count();

	for (let i = 0; i < anchorCount; i++) {
		await testAnchor(anchors.nth(i), page, context);
	}
});
