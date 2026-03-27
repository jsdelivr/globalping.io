import { refreshProbesCache } from '../utils/getCachedProbes';

const REFRESH_INTERVAL_MS = 60_000;

export default defineNitroPlugin((nitro) => {
	const refresh = async () => {
		await refreshProbesCache(nitro.options.runtimeConfig?.public?.apiHost);
	};

	const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
	refresh().catch(() => {});

	nitro.hooks.hook('close', () => {
		clearInterval(interval);
	});
});
