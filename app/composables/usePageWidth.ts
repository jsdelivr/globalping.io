import { ref, onMounted, onUnmounted } from 'vue';

export default () => {
	const width = ref(0);

	const updateWidth = () => {
		width.value = window.innerWidth;
	};

	onMounted(() => {
		if (typeof window !== 'undefined') {
			updateWidth();
			window.addEventListener('resize', updateWidth, { passive: true });
		}
	});

	onUnmounted(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateWidth);
		}
	});

	return width;
};
