<!-- eslint-disable vue/no-v-html -->
<template>
	<main class="ractive-component" v-html="errPageHtml"/>
</template>

<script setup lang="ts">
	import type { NuxtError } from '#app';
	import type Ractive from 'ractive';
	import usePageHead from '~/composables/usePageHead';

	const { error } = defineProps({
		error: {
			type: Object as () => NuxtError | null,
			default: null,
		},
	});

	const errPageInstance = ref<Ractive<Ractive>>();
	const errPageHtml = ref('');
	const isNotFound = error?.statusCode === 404;

	usePageHead(isNotFound
		? { prefix: 'Page not found', description: 'You may have mistyped the address or the page may have moved.' }
		: { prefix: 'Server error', description: 'An error occurred while loading this page. Please try again in a moment.' });

	const route = useRoute();

	const {
		serverHost,
		assetsHost,
		apiDocsHost,
		assetsVersion,
	} = useRuntimeConfig().public;

	// SSR
	if (import.meta.server) {
		const ErrPage = isNotFound
			? (await import('~/ractive/404')).default
			: (await import('~/ractive/500')).default;

		errPageInstance.value = new ErrPage();
		errPageInstance.value?.set('@shared.serverHost', serverHost);
		errPageInstance.value?.set('@shared.assetsHost', assetsHost);
		errPageInstance.value?.set('@shared.apiDocsHost', apiDocsHost);
		errPageInstance.value?.set('@shared.assetsVersion', assetsVersion);
		errPageInstance.value?.set('@shared.actualPath', route.path);
		errPageHtml.value = errPageInstance.value.toHTML();
	}

	onBeforeUnmount(() => {
		errPageInstance.value?.teardown?.();
	});
</script>
