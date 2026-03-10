<template>
	<span ref="wrapperRef" class="relative z-0 inline-flex text-start">
		<span class="pointer-events-none invisible" aria-hidden="true">{{ number }}</span>
		<span class="absolute inset-0">{{ displayedNumber }}</span>
		<span
			v-if="underline"
			class="bg-primary absolute bottom-0.5 -left-1 -z-10 h-2 transition-all duration-500"
			:style="{ width: `${underlineWidth > 0 ? underlineWidth + 8 : 0}px` }"
		/>
	</span>
</template>

<script setup lang="ts">
	const props = defineProps({
		number: { type: Number, required: true },
		duration: { type: Number, default: 1500 },
		underline: { type: Boolean, default: false },
	});

	const displayedNumber = ref(0);
	const animationReqId = ref();

	const wrapperRef = ref<HTMLElement | null>(null);
	const underlineWidth = ref(0);
	let resizeObserver: ResizeObserver | null = null;

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

	onMounted(() => {
		if (wrapperRef.value) {
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					underlineWidth.value = (entry.target as HTMLElement).offsetWidth;
				}
			});

			resizeObserver.observe(wrapperRef.value);
		}
	});

	onUnmounted(() => {
		window?.cancelAnimationFrame(animationReqId.value);
		resizeObserver?.disconnect();
	});
</script>
