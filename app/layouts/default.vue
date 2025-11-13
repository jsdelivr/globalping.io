<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="flex min-h-screen flex-col justify-between">
		<div ref="headerEl" class="ractive-component" v-html="headerHtml"/>
		<NuxtPage class="flex-1"/>
		<div ref="footerEl" class="ractive-component" v-html="footerHtml"/>
	</div>
</template>

<script setup lang="ts">
	import type Ractive from 'ractive';
	import Footer from '~/ractive/footer';
	import Header from '~/ractive/header';
	import { useAuth } from '~/stores/auth';

	const headerEl = ref<HTMLElement>();
	const footerEl = ref<HTMLElement>();
	const headerInstance = ref<Ractive<Ractive>>();
	const footerInstance = ref<Ractive<Ractive>>();
	const headerHtml = ref('');	// SSR
	const footerHtml = ref('');	// SSR

	const route = useRoute();

	const {
		serverHost,
		assetsHost,
		apiDocsHost,
		assetsVersion,
	} = useRuntimeConfig().public;

	const auth = useAuth();

	watch(() => auth.user, () => setRactiveData());

	const setRactiveData = (ssr = false) => {
		for (const component of [ footerInstance, headerInstance ]) {
			component.value?.set('@shared.serverHost', serverHost);
			component.value?.set('@shared.assetsHost', assetsHost);
			component.value?.set('@shared.apiDocsHost', apiDocsHost);
			component.value?.set('@shared.assetsVersion', assetsVersion);
			component.value?.set('@shared.actualPath', route.path);
			component.value?.set('@shared.user', ssr && !auth.user ? undefined : auth.user);
		}
	};

	// SSR (to avoid layout shift during hydration)
	if (import.meta.server) {
		footerInstance.value = new Footer();
		headerInstance.value = new Header();

		headerInstance.value.set('additionalClasses', 'header-with-globalping-bg');
		setRactiveData(true);

		footerHtml.value = footerInstance.value.toHTML();
		headerHtml.value = headerInstance.value.toHTML();
	}

	onMounted(async () => {
		await auth.fetchUser();

		// clear SSR'd components
		headerInstance.value?.teardown?.();
		footerInstance.value?.teardown?.();
		footerHtml.value = '';
		headerHtml.value = '';

		footerInstance.value = new Footer({ target: footerEl.value });
		headerInstance.value = new Header({ target: headerEl.value });
		headerInstance.value.set('@global.app.signIn', auth.signIn);
		headerInstance.value.set('@global.app.signOut', auth.signOut);
		headerInstance.value.set('additionalClasses', 'header-with-globalping-bg');

		setRactiveData();
	});

	onBeforeUnmount(() => {
		headerInstance.value?.teardown?.();
		footerInstance.value?.teardown?.();
	});
</script>
