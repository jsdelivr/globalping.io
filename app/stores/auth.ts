import { defineStore } from 'pinia';

const COOKIE_NAME = 'gp-user';

export const useAuth = defineStore('auth', {
	state: () => ({
		user: null as User | null,
	}),
	actions: {
		async loadUser () {
			const userCookie = useCookie(COOKIE_NAME, { path: '/' });

			if (userCookie.value) {
				// useCookie deserializes the value automatically.. but this property is missing in ts
				this.user = userCookie.value as unknown as User;
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
				// 401
				this.user = null;
			} finally {
				this.writeCookie();
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
			this.writeCookie();
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
				this.writeCookie(true);
			} catch {}
		},
		writeCookie (clear = false) {
			const userCookie = useCookie(COOKIE_NAME);

			if (clear || !this.user) {
				userCookie.value = undefined;
				return;
			}

			if (this.user) {
				userCookie.value = JSON.stringify(this.user);
			}
		},
	},
});
