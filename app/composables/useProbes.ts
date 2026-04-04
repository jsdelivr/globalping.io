import { getSessionStorageData, setSessionStorageData } from '~/utils/sessionStorage';

const SESSION_STORAGE_KEY = 'probesResponse';
const PROBES_TTL = 1000 * 60 * 60;

export default () => {
	const config = useRuntimeConfig();

	const probeAsyncData = useAsyncData<Probe[]>('gp-probes', async () => {
		if (import.meta.server) {
			const { getCachedProbes } = await import('~~/server/utils/getCachedProbes');
			return getCachedProbes(config.public.apiHost);
		}

		if (import.meta.client) {
			// client-side navigation
			const sessionStorageData = getSessionStorageData(SESSION_STORAGE_KEY);

			if (sessionStorageData?.length) {
				return sessionStorageData;
			}

			return $fetch<Probe[]>(`${config.public.apiHost}/v1/probes`);
		}

		return [];
	});

	watch(probeAsyncData.data, (newData) => {
		if (import.meta.client && newData?.length) {
			setSessionStorageData(newData, SESSION_STORAGE_KEY, PROBES_TTL);
		}
	}, { immediate: true });

	return probeAsyncData;
};
