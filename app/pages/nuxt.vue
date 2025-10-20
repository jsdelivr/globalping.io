<template>
	<section class="w-full flex flex-col items-center justify-center gap-4 min-h-screen  relative">
		<h3 class="font-bold text-3xl">Welcome to /nuxt!</h3>
		<button class="rounded-lg bg-green-400 border-green-700 py-1 px-10 duration-300 hover:scale-110 hover:bg-green-200 hover:cursor-pointer" @click="cnt += 1">{{cnt}}</button>
		<small class="hidden">This page uses tailwindcss, if you see this message, it is not working properly.</small>
	</section>
</template>

<script setup lang="ts">
const cnt = ref<number>(0);
</script>
