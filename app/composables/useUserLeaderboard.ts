import { USERNAME_TAG_PATTERN } from '~/constants';

type UserDataAccumulator = {
	username: string;
	totalProbes: number;
	countries: Set<string>;
	cities: Set<string>;
	asns: Set<number>;
};

export interface PageOptions {
	page: MaybeRefOrGetter<number>;
	itemsPerPage: MaybeRef<number>;
}

export type UserList = {
	username: string;
	rank: number;
	totalProbes: number;
	countries: number;
	cities: number;
	asns: number;
}[];

export default ({ page, itemsPerPage }: PageOptions) => {
	const { data: probes, pending: loading } = useProbes();

	const fullUserList = computed(() => {
		if (!probes.value) {
			return [];
		}

		const userMap = probes.value.reduce<Record<string, UserDataAccumulator>>((acc, probe) => {
			const userTag = probe.tags.find(tag => USERNAME_TAG_PATTERN.test(tag));

			if (!userTag) {
				return acc;
			}

			const username = userTag.slice(2);

			if (!acc[username]) {
				acc[username] = {
					username,
					totalProbes: 0,
					countries: new Set(),
					cities: new Set(),
					asns: new Set(),
				};
			}

			acc[username]!.totalProbes++;
			acc[username]!.countries.add(probe.location.country);
			acc[username]!.cities.add(probe.location.city);
			acc[username]!.asns.add(probe.location.asn);

			return acc;
		}, Object.create(null));

		return Object.values(userMap).map((userData) => {
			return {
				username: userData.username,
				totalProbes: userData.totalProbes,
				countries: userData.countries.size,
				cities: userData.cities.size,
				asns: userData.asns.size,
			};
		}).sort((lhs, rhs) => {
			return rhs.totalProbes - lhs.totalProbes || lhs.username.localeCompare(rhs.username);
		}).map((userData, index) => ({ ...userData, rank: index + 1 }));
	});

	const userList = computed<UserList>(() => {
		const pageVal = toValue(page);
		const itemsPerPageVal = toValue(itemsPerPage);

		return fullUserList.value.slice(pageVal * itemsPerPageVal, (pageVal + 1) * itemsPerPageVal);
	});

	const countriesCovered = computed(() => {
		if (!probes.value) {
			return 0;
		}

		return probes.value.reduce((acc, probe) => {
			acc.add(probe.location.country);
			return acc;
		}, new Set()).size;
	});

	const userCount = computed(() => fullUserList.value.length);

	return {
		userCount,
		userList,
		probesHosted: computed(() => probes.value?.length || 0),
		countriesCovered,
		loading,
	};
};
