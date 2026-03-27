// @ts-expect-error https://github.com/nuxt/nuxt/issues/34589 imports in /server/middleware are broken
import { useRuntimeConfig } from '#imports';
import { defineEventHandler, getRequestURL, type H3Event } from 'h3';
import getCachedProbes from '../utils/getCachedProbes';

export default defineEventHandler(async (event: H3Event) => {
	const url = getRequestURL(event);
	const config = useRuntimeConfig(event);

	const targetPages = config.injectProbesPaths as string[];

	const requiresProbeData
		= targetPages.some(pagePath => url.pathname === pagePath || url.pathname.startsWith(`${pagePath}/`));

	if (!requiresProbeData) {
		return;
	}

	try {
		event.context.probes = await getCachedProbes();
	} catch {
		event.context.probes = [];
	}
});
