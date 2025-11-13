import { defineStore } from 'pinia';

export const useAuth = defineStore('auth', {
	state: () => ({
		user: null as User | null,
	}),
	actions: {
		async fetchUser () {
			try {
				const { dashboardHost } = useRuntimeConfig().public;
				const res = await $fetch<{ data: User }>(`${dashboardHost}/users/me`, { credentials: 'include' });
				this.user = res?.data ?? null;
			} catch {
				// 401
			} finally {
				this.user = this.user ?? null;
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
			} catch {}
		},
	},
});
