<template>
	<img
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
</script>
