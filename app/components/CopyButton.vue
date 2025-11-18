<template>
	<button v-tooltip.top="'Copy to Clipboard'" class="btn-primary size-10" @click="copyToClipboard(text)">
		<img class="mx-auto size-5" src="~/assets/images/icons/copy.svg" alt="">
	</button>
</template>

<script setup lang="ts">
	import { copyToClipboard } from '~/utils/misc';
	const { text } = defineProps<{ text: string }>();
</script>
