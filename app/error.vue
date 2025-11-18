<!-- eslint-disable vue/no-v-html -->
<template>
	<main class="ractive-component" v-html="errPageHtml"/>
</template>

<script setup lang="ts">
	import type { NuxtError } from '#app';
	import type Ractive from 'ractive';
	import usePageHead from '~/composables/usePageHead';
	import ErrPage from '~/ractive/404';

	const { error } = defineProps({
		error: {
			type: Object as () => NuxtError | null,
			default: null,
		},
	});

	const errPageInstance = ref<Ractive<Ractive>>();
	const errPageHtml = ref('');

	usePageHead({ prefix: 'Page not found', description: 'Page not found - Globalping' });
	const route = useRoute();

	const {
		serverHost,
		assetsHost,
		apiDocsHost,
		assetsVersion,
	} = useRuntimeConfig().public;

	if (error?.statusCode !== 404) {
		window.location.href = '/';
	}

	// SSR
	if (import.meta.server) {
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
