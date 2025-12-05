import { getSessionStorageData, setSessionStorageData } from '~/utils/session-storage';

const SESSION_STORAGE_KEY = 'probesResponse';
const PROBES_TTL = 1000 * 60 * 60;

export default () => {
	const nuxtApp = useNuxtApp();
	const { apiHost } = useRuntimeConfig().public;

	return useFetch<Probe[]>(`${apiHost}/v1/probes`, {
		key: 'gp-probes',
		server: false,
		default: () => [],
		getCachedData (key) {
			const data = nuxtApp.payload.data[key] || nuxtApp.static.data[key] || getSessionStorageData(SESSION_STORAGE_KEY);
			return data?.length ? data : undefined;
		},
		onResponse ({ response }) {
			const data = response._data;

			if (data?.length) {
				setSessionStorageData(data, SESSION_STORAGE_KEY, PROBES_TTL);
			}
		},
	});
};
