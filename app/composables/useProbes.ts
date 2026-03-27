import { getSessionStorageData, setSessionStorageData } from '~/utils/session-storage';

const SESSION_STORAGE_KEY = 'probesResponse';
const PROBES_TTL = 1000 * 60 * 60;

export default () => {
	const config = useRuntimeConfig();

	const probeAsyncData = useAsyncData<Probe[]>('gp-probes', async () => {
		if (import.meta.server) {
			// see server/middleware/injectProbes.ts
			const event = useRequestEvent();
			return event?.context.probes || [];
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
