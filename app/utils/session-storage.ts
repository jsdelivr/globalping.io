import { isClient } from './misc';

export const getSessionStorageData = (key: string) => {
	if (!isClient()) {
		return null;
	}

	const data = window?.sessionStorage?.getItem(key);
	const cache = data ? JSON.parse(data) : null;
	return cache?.data && cache?.ttl > Date.now() ? cache.data : null;
};

export const setSessionStorageData = <T>(data: T, key: string, ttl: number) => {
	if (!isClient()) {
		return;
	}

	window?.sessionStorage?.setItem(key, JSON.stringify({ data, ttl: Date.now() + ttl }));
};
