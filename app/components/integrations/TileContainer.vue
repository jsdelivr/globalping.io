<template>
	<div
		data-testid="integration-tile"
		class="outline-surface-300 group relative overflow-hidden rounded-md p-6 outline-1 transition-all duration-300 hover:shadow-md"
		:class="{
			'bg-surface-50': props.disabled,
			'hover:outline-primary': !props.disabled,
		}"
	>
		<div class="z-10 flex size-full flex-col gap-2.5">
			<slot/>
		</div>
		<span
			class="pointer-events-none absolute inset-0 size-full bg-linear-to-t to-transparent opacity-0 transition-all duration-300 group-hover:opacity-5"
			:class="{
				'from-surface-700': props.disabled,
				'from-primary': !props.disabled,
			}"/>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		disabled: {
			type: Boolean,
			default: false,
		},
	});
</script>
