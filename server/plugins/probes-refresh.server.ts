// @ts-expect-error https://github.com/nuxt/nuxt/issues/34589 imports in /server/middleware are broken
import { useRuntimeConfig } from '#imports';
import { defineNitroPlugin } from 'nitropack/runtime';
import { refreshProbesCache } from '../utils/getCachedProbes';

const REFRESH_INTERVAL_MS = 60_000;

export default defineNitroPlugin((nitro) => {
	const apiHost = useRuntimeConfig().public.apiHost;

	const refresh = async () => {
		await refreshProbesCache(apiHost);
	};

	const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
	refresh().catch(() => {});

	nitro.hooks.hook('close', () => {
		clearInterval(interval);
	});
});
