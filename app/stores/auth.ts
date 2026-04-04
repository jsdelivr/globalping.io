import type { FetchError } from 'ofetch';
import { defineStore } from 'pinia';
import { getSessionStorageData, setSessionStorageData } from '~/utils/sessionStorage';

const STORAGE_KEY = 'gp-user';

export const useAuth = defineStore('auth', {
	state: () => ({
		user: null as User | null,
	}),
	actions: {
		async fetchUser () {
			if (!isClient()) {
				return null;
			}

			const userDetails = getSessionStorageData(STORAGE_KEY);

			if (typeof userDetails !== 'undefined') {
				this.user = userDetails as User | null;
			}

			try {
				const { dashboardHost } = useRuntimeConfig().public;
				const res = await $fetch<{ data: User }>(`${dashboardHost}/users/me`, { credentials: 'include', retry: 0 });
				this.user = res?.data ?? null;
			} catch (error) {
				if ((error as FetchError).statusCode === 401) {
					this.user = null;
				}
			} finally {
				this.setSessionData();
			}

			return this.user;
		},
		async signIn () {
			const { dashboardHost, serverHost } = useRuntimeConfig().public;
			const url = new URL(`${dashboardHost}/auth/login/github`);

			url.searchParams.set(
				'redirect',
				`${serverHost}/auth/callback?redirect=${encodeURIComponent(window.location.href)}`,
			);

			navigateTo(url.toString(), { external: true });
		},
		async signOut () {
			const { dashboardHost } = useRuntimeConfig().public;

			try {
				await $fetch(`${dashboardHost}/auth/logout`, {
					method: 'POST',
					body: JSON.stringify({ mode: 'session' }),
					credentials: 'include',
				});

				this.user = null;
				this.setSessionData();
			} catch {}
		},
		setSessionData () {
			setSessionStorageData(this.user, STORAGE_KEY, 1000 * 60 * 60 * 24);
		},
	},
});
