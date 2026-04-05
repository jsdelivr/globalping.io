const { test } = require('./fixtures');
const { expect } = require('@playwright/test');
const { normalizeMultilineText } = require('../utils');

test('CLI page', async ({ page }) => {
	let response = await page.goto('/cli');
	expect(response.ok()).toBeTruthy();

	// wait until hydration is finished (otherwise reading clipboard fails regardless of test composition)
	await page.waitForLoadState('networkidle');

	await expect(page.getByText('Run network commands on a global network')).toBeVisible();

	// how to install commands
	await expect(page.getByTestId('cli-os-DEB')).toBeVisible();
	await expect(page.getByTestId('cli-os-RPM')).toBeVisible();
	await expect(page.getByTestId('cli-os-Homebrew')).toBeVisible();

	// test that the active command changes when clicking on different OS's
	let cmd = page.getByTestId('cli-os-cmd');

	let initialActiveText = await cmd.innerText();
	expect(initialActiveText.length).toBeGreaterThan(0);

	await page.getByTestId('cli-os-RPM').click();
	await expect(cmd.innerText()).not.toEqual(initialActiveText);

	let copyBtn = page.getByTestId('copy-btn');
	await expect(copyBtn).toBeVisible();

	await page.context().grantPermissions([ 'clipboard-read', 'clipboard-write' ]);

	await copyBtn.click();

	let clipboardText = normalizeMultilineText(await page.evaluate(() => navigator.clipboard.readText()));
	let innerCmdText = normalizeMultilineText(await cmd.innerText());
	await expect(clipboardText).toEqual(innerCmdText);

	// quick start section
	await expect(page.getByTestId('cli-quick-start-ping')).toBeVisible();
	await expect(page.getByTestId('cli-quick-start-traceroute')).toBeVisible();
	await expect(page.getByTestId('cli-quick-start-http')).toBeVisible();
	await expect(page.getByTestId('cli-quick-start-dns')).toBeVisible();
	await expect(page.getByTestId('cli-quick-start-mtr')).toBeVisible();

	// test that the displayed output changes when clicking on different test types
	let initialQuickStartText = await page.getByTestId('cli-quick-start-content').innerText();
	expect(initialQuickStartText.length).toBeGreaterThan(0);

	await page.getByTestId('cli-quick-start-traceroute').click();

	let quickStartTraceroute = page.getByTestId('cli-quick-start-content');
	await expect(quickStartTraceroute.innerText()).not.toEqual(initialQuickStartText);
	let quickStartTracerouteLen = (await quickStartTraceroute.innerText()).length;
	await expect(quickStartTracerouteLen).toBeGreaterThan(0);
});
