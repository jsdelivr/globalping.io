import isInViewport from '~/utils/isInViewport';

export default (elementRef: Ref<HTMLElement | null>) => {
	const inViewport = ref(false);

	const handleScrollOrResize = () => {
		if (elementRef.value) {
			inViewport.value = isInViewport(elementRef.value);
		}
	};

	onMounted(() => {
		handleScrollOrResize();
		window.addEventListener('scroll', handleScrollOrResize, { passive: true });
		window.addEventListener('resize', handleScrollOrResize, { passive: true });
	});

	onUnmounted(() => {
		window.removeEventListener('scroll', handleScrollOrResize);
		window.removeEventListener('resize', handleScrollOrResize);
	});

	return inViewport;
};
