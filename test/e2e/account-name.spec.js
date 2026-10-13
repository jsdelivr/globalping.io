const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

const USER = {
	id: 'user-1',
	account: [ 'personal-account-1' ],
	github_username: 'john',
	memberships: [{ role: 'admin', org: { name: 'john-org', account: [ 'org-account-1' ] } }],
};

const signInAs = async (page, activeAccountCookie, user = USER, path = '/') => {
	await page.route('https://dash-directus.globalping.io/users/me**', route => route.fulfill({
		json: { data: user },
		headers: { 'Access-Control-Allow-Origin': route.request().headers().origin, 'Access-Control-Allow-Credentials': 'true' },
	}));

	await page.goto(path);

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

	test('shows the same name on a Nuxt page', async ({ page }) => {
		await signInAs(page, 'user-1:org-account-1', USER, '/leaderboard');
		await expect(page.locator('header .current-user')).toHaveText('john-org (john)');
	});

	test('shows the default org when the active account belongs to another user', async ({ page }) => {
		await signInAs(page, 'user-2:personal-account-2', { ...USER, default_account: 'org-account-1' });
		await expect(page.locator('header .current-user')).toHaveText('john-org (john)');
	});

	for (let path of [ '/', '/leaderboard' ]) {
		test(`signing out and in again keeps the active account on ${path}`, async ({ page }) => {
			await page.route('https://dash-directus.globalping.io/auth/logout', route => route.fulfill({
				status: 204,
				headers: { 'Access-Control-Allow-Origin': route.request().headers().origin, 'Access-Control-Allow-Credentials': 'true' },
			}));

			await signInAs(page, 'user-1:org-account-1', USER, path);
			let pageUrl = page.url();
			await page.route('https://dash-directus.globalping.io/auth/login/github**', route => route.fulfill({ status: 302, headers: { location: pageUrl } }));

			let menu = page.locator('header .dropdown:has(.current-user)');
			await menu.locator('.dropdown-toggle').click();
			await menu.getByText('Sign Out').click();
			await page.locator('header .btn-sign-in').first().click();

			await expect(page.locator('header .current-user')).toHaveText('john-org (john)');
			expect((await page.context().cookies()).find(({ name }) => name === 'gp_active_account')?.value).toBe('user-1:org-account-1');
		});
	}

	test('shows the default org without an active account', async ({ page }) => {
		await signInAs(page, null, { ...USER, default_account: 'org-account-1' });
		await expect(page.locator('header .current-user')).toHaveText('john-org (john)');
	});

	test('shows the default org when the active account is not among the memberships', async ({ page }) => {
		await signInAs(page, 'user-1:org-account-2', { ...USER, default_account: 'org-account-1' });
		await expect(page.locator('header .current-user')).toHaveText('john-org (john)');
	});

	test('prefers the active account over the default one', async ({ page }) => {
		await signInAs(page, 'user-1:personal-account-1', { ...USER, default_account: 'org-account-1' });
		await expect(page.locator('header .current-user')).toHaveText('john');
	});
});
