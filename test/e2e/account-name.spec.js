const { test } = require('./fixtures');
const { expect, test: unitTest } = require('@playwright/test');
const { getAccountDisplay } = require('../../src/assets/js/utils/account-name');

const USER_ROUTE = url => url.pathname === '/users/me';
const ACTIVE_ACCOUNT_ROUTE = url => url.pathname === '/accounts/active';
const ACCOUNT_MENU = 'header .account-menu';
const PERSONAL_AVATAR = '/avatar/github/583231?size=80';
const ORG_AVATAR = '/avatar/github/6128107?size=80';
const AVATAR_ROUTE = src => url => `${url.pathname}${url.search}` === src;
const USER = {
	id: 'user-1',
	github_username: 'john',
	external_identifier: '583231',
	memberships: [{ org: { name: 'member-org', github_id: '6128107', account: [ 'org-account-1' ] } }],
};

const CORS_HEADERS = route => ({ 'Access-Control-Allow-Origin': route.request().headers().origin, 'Access-Control-Allow-Credentials': 'true' });

const signInAs = async (page, activeAccountId, user = USER, path = '/') => {
	await page.route(USER_ROUTE, (route) => {
		let fields = new URL(route.request().url()).searchParams.get('fields')?.split(',');
		let data = {
			...user,
			memberships: user.memberships.map(membership => ({
				...membership,
				org: { ...membership.org, github_id: fields?.includes('memberships.org.github_id') ? membership.org.github_id : undefined },
			})),
		};

		return route.fulfill({ json: { data }, headers: CORS_HEADERS(route) });
	});

	await page.route(ACTIVE_ACCOUNT_ROUTE, route => route.fulfill({ json: { accountId: activeAccountId }, headers: CORS_HEADERS(route) }));
	await page.goto(path);
};

unitTest('substitutes seed avatar IDs only on localhost', () => {
	let user = { ...USER, external_identifier: '1234567890', memberships: [{ org: { name: 'member-org', github_id: '9000000002', account: 'org-account-1' } }] };
	let orgUser = { ...user, active_account: 'org-account-1' };

	expect(getAccountDisplay(user, 'localhost').avatarSrc).toBe(PERSONAL_AVATAR);
	expect(getAccountDisplay(orgUser, 'localhost').avatarSrc).toBe('/avatar/github/102991324?size=80');
	expect(getAccountDisplay(user, 'globalping.io').avatarSrc).toBe('/avatar/github/1234567890?size=80');
	expect(getAccountDisplay(orgUser, 'globalping.io').avatarSrc).toBe('/avatar/github/9000000002?size=80');
});

test.describe('Header account name', () => {
	test.beforeEach(async ({ page }) => {
		await page.route(url => url.pathname.startsWith('/avatar/github/'), route => route.fulfill({
			contentType: 'image/svg+xml',
			body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="40" fill="green"/></svg>',
		}));
	});

	test('shows the active org avatar and keeps the full identity in the menu', async ({ page }) => {
		await signInAs(page, 'org-account-1');
		await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveText('Dashboard', { useInnerText: true });
		let accountButton = page.getByRole('button', { name: 'Account menu', exact: true });
		let avatar = accountButton.locator('img');
		await expect(avatar).toHaveAttribute('src', ORG_AVATAR);
		await expect(avatar).toBeVisible();
		await expect(avatar).toHaveJSProperty('naturalWidth', 80);
		await accountButton.hover();
		await expect(avatar).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
		await expect(avatar).toHaveCSS('border-radius', '50%');
		await expect(accountButton).toHaveText('');
		await expect(page.locator(ACCOUNT_MENU).getByText('member-org (john)', { exact: true })).toBeHidden();
		await accountButton.click();
		await expect(page.locator(ACCOUNT_MENU).getByText('member-org (john)', { exact: true })).toBeVisible();
	});

	test('shows the org icon if the avatar fails', async ({ page }) => {
		await page.route(AVATAR_ROUTE(ORG_AVATAR), route => route.abort());
		await signInAs(page, 'org-account-1');
		await expect(page.getByRole('button', { name: 'Account menu', exact: true }).locator('svg')).toBeVisible();
	});

	test('shows separate Dashboard and Sign Out links in the mobile nav', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.route(url => url.pathname === '/auth/logout', route => route.fulfill({ status: 204, headers: CORS_HEADERS(route) }));
		await signInAs(page, 'org-account-1');
		let dashboard = page.locator('header .btn-dash');
		await expect(dashboard).toBeAttached();
		await page.getByRole('button', { name: 'Toggle navigation' }).click();

		let signOut = page.getByRole('link', { name: 'Sign Out', exact: true });
		let identity = dashboard.locator('.dashboard-account');

		await expect(dashboard).toBeVisible();
		await expect(identity).toBeVisible();
		await expect(identity).toHaveText('member-org (john)');
		await expect(page.getByRole('button', { name: 'Account menu', exact: true, includeHidden: true })).toBeHidden();
		await dashboard.press('Tab');
		await expect(signOut).toBeFocused();
		await signOut.press('Enter');
		await expect(dashboard).toHaveCount(0);
	});

	test('shows the personal avatar with the username in its menu', async ({ page }) => {
		await signInAs(page, 'personal-account-1');
		let accountButton = page.getByRole('button', { name: 'Account menu', exact: true });
		await expect(accountButton.locator('img')).toHaveAttribute('src', PERSONAL_AVATAR);
		await accountButton.click();
		await expect(page.locator(ACCOUNT_MENU).getByText('john', { exact: true })).toBeVisible();
	});

	test('shows the username when the active account is not among the memberships', async ({ page }) => {
		await signInAs(page, 'org-account-2');
		await expect(page.locator('header .current-user')).toHaveText('john');
	});

	test('shows the account avatar and signs out without navigating on a Nuxt page', async ({ page }) => {
		await page.route(url => url.pathname === '/auth/logout', route => route.fulfill({ status: 204, headers: CORS_HEADERS(route) }));
		await signInAs(page, 'org-account-1', USER, '/leaderboard#__nuxt');
		let accountButton = page.getByRole('button', { name: 'Account menu', exact: true });
		await expect(accountButton.locator('img')).toHaveAttribute('src', ORG_AVATAR);
		await accountButton.click();
		await expect(page.locator(ACCOUNT_MENU).getByText('member-org (john)', { exact: true })).toBeVisible();
		await page.getByRole('link', { name: 'Sign Out', exact: true }).click();
		await expect(accountButton).toHaveCount(0);
		await expect(page).toHaveURL(/\/leaderboard#__nuxt$/);
	});

	test('drops a saved user when signed out and /accounts/active fails first', async ({ page }) => {
		let savedUser = { ...USER, active_account: 'org-account-1', memberships: [{ org: { ...USER.memberships[0].org, account: 'org-account-1' } }] };
		let releaseUser;
		let userReleased = new Promise(resolve => releaseUser = resolve);

		await page.addInitScript(data => window.sessionStorage.setItem('gp-user', JSON.stringify({ data, ttl: Date.now() + 60000 })), savedUser);

		await page.route(USER_ROUTE, async (route) => {
			await userReleased;
			await route.fulfill({ status: 401, json: { errors: [] }, headers: CORS_HEADERS(route) });
		});

		await page.route(ACTIVE_ACCOUNT_ROUTE, route => route.fulfill({ status: 400, json: { errors: [] }, headers: CORS_HEADERS(route) }));
		await page.goto('/leaderboard');
		await expect(page.locator('header .current-user')).toHaveText('member-org (john)');
		releaseUser();
		await expect(page.locator('header .current-user')).toHaveCount(0);
	});
});
