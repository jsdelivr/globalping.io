<template>
	<span>{{displayedNumber}}</span>
</template>

<script setup lang="ts">
	const props = defineProps({
		number: { type: Number, required: true },
		duration: { type: Number, default: 1500 },
	});

	const displayedNumber = ref(0);
	const animationReqId = ref();

	const easeInOutFn = (val: number) => {
		const sqr = Math.pow(val, 2);
		return sqr / (2 * (sqr - val) + 1);
	};

	const animateChange = (init_num: number, start_time: number) => {
		window?.cancelAnimationFrame(animationReqId.value);

		animationReqId.value = window?.requestAnimationFrame(() => {
			const curr_duration = Date.now() - start_time;
			const animation_progress = curr_duration / props.duration;

			if (animation_progress >= 1) {
				displayedNumber.value = props.number;
				return;
			}

			const step = (props.number - init_num) * easeInOutFn(animation_progress);
			displayedNumber.value = init_num + Math.round(step);
			animateChange(init_num, start_time);
		});
	};

	watch(() => props.number, () => {
		animateChange(displayedNumber.value, Date.now());
	}, { immediate: true });

	onUnmounted(() => window.cancelAnimationFrame(animationReqId.value));
</script>
