const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

const USER = {
	id: 'user-1',
	github_username: 'john',
	memberships: [{ role: 'admin', org: { name: 'john-org', account: [ 'org-account-1' ] } }],
};

const signInAs = async (page, activeAccountCookie) => {
	await page.route('https://dash-directus.globalping.io/users/me**', route => route.fulfill({
		json: { data: USER },
		headers: { 'Access-Control-Allow-Origin': route.request().headers().origin, 'Access-Control-Allow-Credentials': 'true' },
	}));

	await page.goto('/');

	if (activeAccountCookie) {
		await page.context().addCookies([{ name: 'gp_active_account', value: activeAccountCookie, url: page.url() }]);
		await page.reload();
	}
};

test.describe('Header account name', () => {
	test('shows the org the user acts as on the dashboard, with the user', async ({ page }) => {
		await signInAs(page, 'user-1:org-account-1');
		await expect(page.locator('header .current-user')).toHaveText('john-org (john)');
	});

	test('shows the username without an active account', async ({ page }) => {
		await signInAs(page, null);
		await expect(page.locator('header .current-user')).toHaveText('john');
	});

	test('shows the username when the active account belongs to another user', async ({ page }) => {
		await signInAs(page, 'user-2:org-account-1');
		await expect(page.locator('header .current-user')).toHaveText('john');
	});

	test('shows the username when the active account is not among the memberships', async ({ page }) => {
		await signInAs(page, 'user-1:org-account-2');
		await expect(page.locator('header .current-user')).toHaveText('john');
	});
});
