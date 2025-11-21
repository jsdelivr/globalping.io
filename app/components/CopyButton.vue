<template>
	<div class="!absolute">
		<button
			v-tooltip.top="'Copy to Clipboard'"
			aria-label="Copy to clipboard"
			class="btn-primary size-10"
			@click="copyCommand"
			@mouseleave="hideCopiedTooltip"
			@blur="hideCopiedTooltip">
			<img class="mx-auto size-5" src="~/assets/images/icons/copy.svg" alt="">
		</button>
		<!-- This needs to match the v-tooltip styles. -->
		<div v-if="copiedTooltip" role="tooltip" class="p-fadein absolute -top-9 left-1/2 -translate-x-1/2 px-0 py-1">
			<div class="bg-dark-700 rounded-md p-2 text-[12px] leading-none font-semibold break-words whitespace-pre-line text-white">Copied!</div>
			<div class="border-t-dark-700 absolute bottom-0 left-1/2 ml-[-10px] h-0 w-0 border-x-[10px] border-t-[10px] border-b-0 border-solid border-transparent"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { copyToClipboard } from '~/utils/misc';
	const { text } = defineProps<{ text: string }>();

	const copiedTooltip = ref(false);
	const tooltipHideTimeout = ref<NodeJS.Timeout>();

	const copyCommand = async () => {
		await copyToClipboard(text);
		copiedTooltip.value = true;

		clearTimeout(tooltipHideTimeout.value);

		tooltipHideTimeout.value = setTimeout(hideCopiedTooltip, 1000);
	};

	const hideCopiedTooltip = () => {
		copiedTooltip.value = false;
	};

	onBeforeUnmount(() => {
		clearTimeout(tooltipHideTimeout.value);
	});
</script>
