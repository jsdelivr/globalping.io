<template>
	<span>{{displayedNumber}}</span>
</template>

<script setup lang="ts">
	const { number } = defineProps<{ number: number }>();

	const displayedNumber = ref(0);
	const timeout = ref();

	const animateChange = (step = 1) => {
		clearTimeout(timeout.value);

		if (number === displayedNumber.value) {
			return;
		}

		timeout.value = setTimeout(() => {
			displayedNumber.value = Math.min(number, displayedNumber.value + step);
			animateChange(step + 1);
		}, 10);
	};

	watch(() => number, () => {
		animateChange(1);
	}, { immediate: true });

	onUnmounted(() => clearTimeout(timeout.value));
</script>
