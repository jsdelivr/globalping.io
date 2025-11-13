<template>
	<section class="relative flex w-full flex-col items-center justify-center gap-4 duration-200 ease-in-out" :class="{'bg-black/90': switchColor}">
		<h3 class="text-3xl font-bold duration-300 select-none" :class="{'text-blue-50': switchColor, 'text-initial': !switchColor}">Welcome to <span class="cursor-pointer bg-linear-to-r from-green-400 to-blue-500 bg-clip-text text-transparent" @click="switchColor = !switchColor">Nuxt</span> pages!</h3>
		<a href="/" class="text-blue-500 hover:underline">Back to Ractive.js pages</a>
		<small class="hidden">This page uses tailwindcss, if you see this message, it is not working properly.</small>
	</section>
</template>

<script setup lang="ts">
	import { usePageHead } from '~/composables/usePageHead';

	const switchColor = ref(false);

	usePageHead('CLI');
</script>
