export const useGlobalpingUser = () => {
	const { dashboardHost } = useRuntimeConfig().public;

	return useLazyFetch<{ data: User | null }>(`${dashboardHost}/users/me`, {
		default: () => ({ data: null }),
		pick: [ 'data' ],
	});
};
