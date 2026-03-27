import { useRuntimeConfig } from '#imports';

export default defineCachedFunction(async () => {
	const data = await $fetch(`${useRuntimeConfig().public.apiHost}/v1/probes`);

	if (!data || !Array.isArray(data)) {
		throw new Error('Malformed probe response.');
	}

	return data;
}, {
	maxAge: 60,
	staleMaxAge: 3540,
	swr: true,
	name: 'probes-cache',
	getKey: () => 'probes-cache',
});
