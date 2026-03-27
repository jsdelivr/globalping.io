let cachedProbes: unknown[] | null = null;
let refreshPromise: Promise<unknown[]> | null = null;

const fetchProbes = async (apiHost: string) => {
	const data = await $fetch(`${apiHost}/v1/probes`, { timeout: 5000 });

	if (!data || !Array.isArray(data)) {
		throw new Error('Malformed probe response.');
	}

	return data;
};

export const refreshProbesCache = async (apiHost: string) => {
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = fetchProbes(apiHost);

	try {
		cachedProbes = await refreshPromise;
	} catch {} finally {
		refreshPromise = null;
	}

	return cachedProbes;
};

export const getCachedProbes = async (apiHost: string) => {
	if (cachedProbes) {
		return cachedProbes;
	}

	return await refreshProbesCache(apiHost) || [];
};
