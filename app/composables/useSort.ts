type SortOrder = 'asc' | 'desc';
const VALID_SORT_ORDERS = [ 'asc', 'desc' ] as const;

export default <TSortBy extends string> (
	defaultSortBy: TSortBy,
	validSortByOptions: readonly TSortBy[],
	defaultSortOrder: SortOrder = 'desc' as SortOrder,
	queryKeyBy: string = 'by',
	queryKeyOrder: string = 'order',
	queryKeyPage: string = 'page',
) => {
	const route = useRoute();
	const router = useRouter();

	const initialBy = route.query[queryKeyBy] as TSortBy;
	const initialOrder = route.query[queryKeyOrder] as SortOrder;

	const sortBy = ref<TSortBy>(validSortByOptions.includes(initialBy) ? initialBy : defaultSortBy) as Ref<TSortBy>;
	const sortOrder = ref<SortOrder>(VALID_SORT_ORDERS.includes(initialOrder) ? initialOrder : defaultSortOrder) as Ref<SortOrder>;

	watch([ sortBy, sortOrder ], ([ newSortBy, newSortOrder ]) => {
		const currentQueryBy = (route.query[queryKeyBy] as TSortBy) || defaultSortBy;
		const currentQueryOrder = (route.query[queryKeyOrder] as SortOrder) || defaultSortOrder;

		if (newSortBy === currentQueryBy && newSortOrder === currentQueryOrder) {
			return;
		}

		const query = { ...route.query };

		Reflect.deleteProperty(query, queryKeyPage);

		if (newSortBy === defaultSortBy) {
			Reflect.deleteProperty(query, queryKeyBy);
		} else {
			query[queryKeyBy] = newSortBy;
		}

		if (newSortOrder === defaultSortOrder) {
			Reflect.deleteProperty(query, queryKeyOrder);
		} else {
			query[queryKeyOrder] = newSortOrder;
		}

		void router.push({ query });
	});

	watch(
		[ () => route.query[queryKeyBy], () => route.query[queryKeyOrder] ],
		([ newQueryBy, newQueryOrder ]) => {
			const parsedBy = newQueryBy as TSortBy;
			const parsedOrder = newQueryOrder as SortOrder;

			sortBy.value = validSortByOptions.includes(parsedBy) ? parsedBy : defaultSortBy;
			sortOrder.value = [ 'asc', 'desc' ].includes(parsedOrder) ? parsedOrder : defaultSortOrder;
		},
	);

	const onSortChange = (newSortBy: TSortBy) => {
		if (sortBy.value === newSortBy) {
			sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy.value = newSortBy;
			sortOrder.value = 'desc';
		}
	};

	return {
		sortBy,
		sortOrder,
		onSortChange,
	};
};
