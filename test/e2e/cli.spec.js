const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

const removeCarriageReturn = str => str.replace(/\r/g, '');

test('CLI page', async ({ page, context }) => {
	let response = await page.goto('/cli');
	expect(response.ok()).toBeTruthy();

	await expect(page.getByText('Run network commands on a global network')).toBeVisible();

	// how to install commands
	await expect(page.getByTestId('cli-os-DEB')).toBeVisible();
	await expect(page.getByTestId('cli-os-RPM')).toBeVisible();
	await expect(page.getByTestId('cli-os-Homebrew')).toBeVisible();

	// test that the active command changes when clicking on different OS's
	let getActiveCmdText = async () => {
		let el = page.getByTestId('cli-os-cmd-active');
		await expect(el).toBeVisible();

		let spans = el.locator('span');
		let lineCount = await spans.count();
		let lines = [];

		for (let i = 0; i < lineCount; i++) {
			lines.push(await spans.nth(i).innerText());
		}

		return removeCarriageReturn(lines.join('\n'));
	};

	let initialActiveText = await getActiveCmdText();
	expect(initialActiveText.length).toBeGreaterThan(0);

	await page.getByTestId('cli-os-RPM').click();

	let rpmActiveText = await getActiveCmdText();
	await expect(rpmActiveText).not.toEqual(initialActiveText);

	// test clipboard copy
	await context.grantPermissions([ 'clipboard-read' ]);

	let copyBtn = page.getByTestId('cpy-btn-active');
	await expect(copyBtn).toBeVisible();
	await copyBtn.click();

	let clipboardText = await page.evaluate(() => navigator.clipboard.readText());
	expect(removeCarriageReturn(clipboardText)).toEqual(rpmActiveText);

	// quick start section
	await expect(page.getByTestId('cli-quick-start-ping')).toBeVisible();
	await expect(page.getByTestId('cli-quick-start-traceroute')).toBeVisible();
	await expect(page.getByTestId('cli-quick-start-http')).toBeVisible();
	await expect(page.getByTestId('cli-quick-start-dns')).toBeVisible();
	await expect(page.getByTestId('cli-quick-start-mtr')).toBeVisible();

	// test that the displayed output changes when clicking on different test types
	let initialQuickStartText = await page.getByTestId('cli-quick-start-content-active').innerText();
	expect(initialQuickStartText.length).toBeGreaterThan(0);

	await page.getByTestId('cli-quick-start-traceroute').click();

	let quickStartTracerouteText = await page.getByTestId('cli-quick-start-content-active').innerText();
	await expect(quickStartTracerouteText.length).toBeGreaterThan(0);
	await expect(quickStartTracerouteText).not.toEqual(initialQuickStartText);
});
