<template>
	<img
		ref="image"
		:src="currentSrc"
		:alt="alt"
		@error="onError"
	>
</template>

<script setup lang="ts">
	const props = withDefaults(defineProps<{
		src: string;
		fallback: string;
		alt?: string;
	}>(), {
		alt: '',
	});

	const image = ref<HTMLImageElement>();
	const currentSrc = ref(props.src);
	const hasErrored = ref(false);

	watch(() => props.src, (newSrc) => {
		currentSrc.value = newSrc;
		hasErrored.value = false;
	});

	const onError = () => {
		if (!hasErrored.value) {
			currentSrc.value = props.fallback;
			hasErrored.value = true;
		}
	};

	// the error event may fire before hydration attaches the listener
	onMounted(() => {
		if (image.value?.complete && !image.value.naturalWidth) {
			onError();
		}
	});
</script>
