<template>
	<div class="page-shell">
		<div ref="headerEl" class="head"/>
		<NuxtPage/>
		<div ref="footerEl"/>
	</div>
</template>

<script setup lang="ts">
	const headerEl = ref<HTMLElement>(null);
	const footerEl = ref(null);
	const { path } = useRoute();

	const {
		serverHost,
		assetsHost,
		apiDocsHost,
		assetsVersion,
	} = useRuntimeConfig().public;

	let headerInstance;
	let footerInstance;

	onMounted(async () => {
		let [
			{ default: Header },
			{ default: Footer },
		] = await Promise.all([
			import('~/ractive/header'),
			import('~/ractive/footer'),
		]);

		footerInstance = new Footer({ target: footerEl.value, data: {} });
		headerInstance = new Header({ target: headerEl.value, data: {} });

		for (const component of [ headerInstance, footerInstance ]) {
			component.set('@shared.serverHost', serverHost);
			component.set('@shared.assetsHost', assetsHost);
			component.set('@shared.apiDocsHost', apiDocsHost);
			component.set('@shared.assetsVersion', assetsVersion);
			component.set('@shared.actualPath', path);
		}

		headerEl?.value.querySelector('.c-header')?.classList.add('header-with-globalping-bg');
	});

	onBeforeUnmount(() => {
		headerInstance?.teardown?.();
		footerInstance?.teardown?.();
	});
</script>
