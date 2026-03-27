import usePageWidth from '~/composables/usePageWidth';

export interface PaginationOptions {
	itemsPerPage: MaybeRef<number>;
	pageKey?: string;
}

export default ({ itemsPerPage, pageKey = 'page' }: PaginationOptions) => {
	const page = ref(0);
	const route = useRoute();
	const pageWidth = usePageWidth();
	const active = ref(true);

	watch(() => route.query[pageKey], (pageQuery) => {
		if (active.value) {
			const pageQueryNumber = Number(pageQuery);
			const isInteger = Number.isInteger(pageQueryNumber);

			if (pageQuery && isInteger && pageQueryNumber > 0) {
				page.value = pageQueryNumber - 1;
			} else {
				page.value = 0;
			}
		}
	}, { immediate: true });

	onUnmounted(() => {
		active.value = false;
	});

	return {
		page: computed({
			get: () => page.value,
			set: (newPage: number) => {
				page.value = newPage;

				navigateTo({
					path: route.path,
					query: {
						...route.query,
						[pageKey]: newPage ? newPage + 1 : undefined,
					},
				});
			},
		}),
		first: computed(() => page.value * toValue(itemsPerPage)),
		pageLinkSize: computed(() => pageWidth.value <= 640 ? 3 : 5),
		template: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink',
	};
};

