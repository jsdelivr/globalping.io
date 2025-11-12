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
	import { useGlobalpingUser } from '~/composables/useGlobalpingUser';
	import Footer from '~/ractive/footer';
	import Header from '~/ractive/header';

	const headerEl = ref<HTMLElement>();
	const footerEl = ref<HTMLElement>();
	const headerInstance = ref<Ractive<Ractive>>();
	const footerInstance = ref<Ractive<Ractive>>();
	const headerHtml = ref('');	// SSR
	const footerHtml = ref('');	// SSR

	const { path } = useRoute();

	const {
		serverHost,
		assetsHost,
		apiDocsHost,
		assetsVersion,
		dashboardHost,
	} = useRuntimeConfig().public;

	const { data: gpUserData } = await useGlobalpingUser();
	const user = computed(() => gpUserData.value?.data ?? null);

	const signIn = () => {
		const url = new URL(`${dashboardHost}/auth/login/github`);

		url.searchParams.set(
			'redirect',
			`${serverHost}/auth/callback?redirect=${encodeURIComponent(window.location.href)}`,
		);

		navigateTo(url.toString(), { external: true });
	};

	const signOut = async () => {
		await $fetch(`${dashboardHost}/auth/logout`, {
			method: 'POST',
			body: JSON.stringify({ mode: 'session' }),
		});
	};

	const setRactiveData = () => {
		for (const component of [ footerInstance, headerInstance ]) {
			component.value?.set('@shared.serverHost', serverHost);
			component.value?.set('@shared.assetsHost', assetsHost);
			component.value?.set('@shared.apiDocsHost', apiDocsHost);
			component.value?.set('@shared.assetsVersion', assetsVersion);
			component.value?.set('@shared.actualPath', path);
			component.value?.set('@shared.user', user.value);
		}
	};

	// SSR (to avoid layout shift during hydration)
	if (import.meta.server) {
		footerInstance.value = new Footer();
		headerInstance.value = new Header();

		setRactiveData();

		footerHtml.value = footerInstance.value.toHTML();
		headerHtml.value = headerInstance.value.toHTML().replace('c-header', 'c-header header-with-globalping-bg');
	}

	onMounted(() => {
		// clear SSR'd components
		headerInstance.value?.teardown?.();
		footerInstance.value?.teardown?.();
		footerHtml.value = '';
		headerHtml.value = '';

		footerInstance.value = new Footer({ target: footerEl.value });
		headerInstance.value = new Header({ target: headerEl.value });
		headerInstance.value.set('@global.app.signIn', signIn);
		headerInstance.value.set('@global.app.signOut', signOut);
		headerEl.value?.querySelector('.c-header')?.classList.add('header-with-globalping-bg');

		setRactiveData();
	});

	onBeforeUnmount(() => {
		headerInstance.value?.teardown?.();
		footerInstance.value?.teardown?.();
	});
</script>
