import { isClient } from './misc';

export const getSessionStorageData = (key: string) => {
	if (!isClient()) {
		return undefined;
	}

	const data = window?.sessionStorage?.getItem(key);

	try {
		const cache = data ? JSON.parse(data) : null;
		return typeof cache?.data !== 'undefined' && cache?.ttl > Date.now() ? cache.data : null;
	} catch {
		clearSessionStorageData(key);
		return undefined;
	}
};

export const setSessionStorageData = <T>(data: T, key: string, ttl: number) => {
	if (!isClient()) {
		return;
	}

	try {
		window?.sessionStorage?.setItem(key, JSON.stringify({ data, ttl: Date.now() + ttl }));
	} catch {}
};
