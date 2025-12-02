import { defineStore } from 'pinia';
import { clearSessionStorageData, getSessionStorageData, setSessionStorageData } from '~/utils/session-storage';

const STORAGE_KEY = 'gp-user';

export const useAuth = defineStore('auth', {
	state: () => ({
		user: null as User | null,
	}),
	actions: {
		async loadUser () {
			const userDetails = getSessionStorageData(STORAGE_KEY);

			if (userDetails) {
				this.user = userDetails as User;
			}

			// revalidate
			await this.fetchUser();
		},
		async fetchUser () {
			if (!isClient()) {
				return;
			}

			try {
				const { dashboardHost } = useRuntimeConfig().public;
				const res = await $fetch<{ data: User }>(`${dashboardHost}/users/me`, { credentials: 'include' });
				this.user = res?.data ?? null;
			} catch {
				// typically 401
				this.user = null;
			} finally {
				this.setSessionData();
			}
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
				this.setSessionData(true);
			} catch {}
		},
		setSessionData (clear = false) {
			if (clear || !this.user) {
				clearSessionStorageData(STORAGE_KEY);
				return;
			}

			if (this.user) {
				setSessionStorageData(this.user, STORAGE_KEY, 1000 * 60 * 60 * 24);
			}
		},
	},
});
