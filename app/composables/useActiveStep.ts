export const useActiveStep = (initialStep: number = 0) => {
	const activeStep = ref(initialStep);
	const stepRefs = ref<HTMLElement[]>([]);
	let observer: IntersectionObserver | null = null;

	onMounted(() => {
		observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const index = Number(entry.target.getAttribute('data-index'));

					if (!isNaN(index)) {
						activeStep.value = index;
					}
				}
			});
		}, {
			root: null,
			rootMargin: '-45% 0px -45% 0px',
		});

		stepRefs.value.forEach((el) => {
			el && observer?.observe(el);
		});
	});

	onUnmounted(() => {
		observer?.disconnect();
	});

	return { activeStep, stepRefs };
};
