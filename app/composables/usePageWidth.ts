import { ref, onMounted, onUnmounted } from 'vue';

export default () => {
	const width = ref(0);

	const updateWidth = () => {
		width.value = window.innerWidth;
	};

	onMounted(() => {
		updateWidth();
		addEventListener('resize', updateWidth, { passive: true });
	});

	onUnmounted(() => {
		removeEventListener('resize', updateWidth);
	});

	return width;
};
