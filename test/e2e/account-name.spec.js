const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

const USER = {
	id: 'user-1',
	github_username: 'john',
	memberships: [{ org: { name: 'john-org', account: [ 'org-account-1' ] } }],
};

const CORS_HEADERS = route => ({ 'Access-Control-Allow-Origin': route.request().headers().origin, 'Access-Control-Allow-Credentials': 'true' });

const signInAs = async (page, activeAccountId, user = USER, path = '/') => {
	await page.route('https://dash-directus.globalping.io/users/me**', route => route.fulfill({ json: { data: user }, headers: CORS_HEADERS(route) }));
	await page.route('https://dash-directus.globalping.io/accounts/active', route => route.fulfill({ json: { accountId: activeAccountId }, headers: CORS_HEADERS(route) }));
	await page.goto(path);
};

test.describe('Header account name', () => {
	test('shows the org the session acts as, with the user', async ({ page }) => {
		await signInAs(page, 'org-account-1');
		await expect(page.locator('header .current-user')).toHaveText('john-org (john)');
	});

	test('shows the username when the session acts as the personal account', async ({ page }) => {
		await signInAs(page, 'personal-account-1');
		await expect(page.locator('header .current-user')).toHaveText('john');
	});

	test('shows the username when the active account is not among the memberships', async ({ page }) => {
		await signInAs(page, 'org-account-2');
		await expect(page.locator('header .current-user')).toHaveText('john');
	});

	test('shows the same name on a Nuxt page', async ({ page }) => {
		await signInAs(page, 'org-account-1', USER, '/leaderboard');
		await expect(page.locator('header .current-user')).toHaveText('john-org (john)');
	});

	test('drops a saved user when signed out and /accounts/active fails first', async ({ page }) => {
		let savedUser = { ...USER, active_account: 'org-account-1', memberships: [{ org: { name: 'john-org', account: 'org-account-1' } }] };
		let releaseUser;
		let userReleased = new Promise(resolve => releaseUser = resolve);

		await page.addInitScript(data => window.sessionStorage.setItem('gp-user', JSON.stringify({ data, ttl: Date.now() + 60000 })), savedUser);

		await page.route('https://dash-directus.globalping.io/users/me**', async (route) => {
			await userReleased;
			await route.fulfill({ status: 401, json: { errors: [] }, headers: CORS_HEADERS(route) });
		});

		await page.route('https://dash-directus.globalping.io/accounts/active', route => route.fulfill({ status: 400, json: { errors: [] }, headers: CORS_HEADERS(route) }));
		await page.goto('/leaderboard');
		await expect(page.locator('header .current-user')).toHaveText('john-org (john)');
		releaseUser();
		await expect(page.locator('header .current-user')).toHaveCount(0);
	});
});
