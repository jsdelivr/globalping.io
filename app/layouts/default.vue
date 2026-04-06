<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="flex min-h-screen flex-col justify-between">
		<div ref="headerEl" class="ractive-component z-50" v-html="headerHtml"/>
		<NuxtPage class="flex-1"/>
		<div ref="footerEl" class="ractive-component" v-html="footerHtml"/>
	</div>
</template>

<script setup lang="ts">
	import type Ractive from 'ractive';
	import Footer from '~/ractive/footer';
	import Header from '~/ractive/header';
	import { useAuth } from '~/stores/auth';

	const HEADER_PROPERTIES = {
		'default': { additionalClasses: 'header-with-globalping-bg' },
		'about-us': { additionalClasses: 'gp-about-us-header', mainLogoName: 'globalping-full-white.svg' },
	};

	const headerEl = ref<HTMLElement>();
	const footerEl = ref<HTMLElement>();
	const headerInstance = ref<Ractive<Ractive>>();
	const footerInstance = ref<Ractive<Ractive>>();
	const headerHtml = ref('');	// SSR
	const footerHtml = ref('');	// SSR

	const route = useRoute();
	const router = useRouter();

	const {
		serverHost,
		assetsHost,
		apiDocsHost,
		assetsVersion,
	} = useRuntimeConfig().public;

	const pathKey = computed(() => route.path.replace(/^\/|\/$/g, ''));

	const setHeaderProps = () => {
		const props = HEADER_PROPERTIES[pathKey.value as keyof typeof HEADER_PROPERTIES] || HEADER_PROPERTIES.default;

		Object.entries(props).forEach(([ key, value ]) => {
			headerInstance.value?.set(key, value);
		});
	};

	watch(pathKey, () => {
		setHeaderProps();
	}, { immediate: true });

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
		setHeaderProps();
		setRactiveData(true);

		footerHtml.value = footerInstance.value.toHTML();
		headerHtml.value = headerInstance.value.toHTML();
	}

	onMounted(async () => {
		footerInstance.value = new Footer({ target: footerEl.value, enhance: true });
		headerInstance.value = new Header({ target: headerEl.value, enhance: true });
		headerInstance.value.set('@global.app.signIn', auth.signIn);
		headerInstance.value.set('@global.app.signOut', auth.signOut);
		setHeaderProps();

		headerEl.value?.addEventListener('click', handleRactiveNavigation);
		footerEl.value?.addEventListener('click', handleRactiveNavigation);

		setRactiveData();
	});

	onBeforeUnmount(() => {
		headerInstance.value?.teardown?.();
		footerInstance.value?.teardown?.();

		headerEl.value?.removeEventListener('click', handleRactiveNavigation);
		footerEl.value?.removeEventListener('click', handleRactiveNavigation);
	});

	// let the Nuxt router handle inter-Nuxt-page navigation
	// without this, the layout is forced to reload, causing flickering and other issues
	const handleRactiveNavigation = (event: MouseEvent) => {
		// ignore non-primary clicks
		if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
			return;
		}

		if (!(event.target instanceof Element)) {
			return;
		}

		const target = event.target as HTMLElement;
		const link = target?.closest('a');

		if (!link || !link.href || link.hasAttribute('download') || link.getAttribute('rel') === 'external') {
			return;
		}

		const linkTarget = link.getAttribute('target');
		const url = new URL(link.href);
		const resolved = router.resolve(url.pathname);

		if ((linkTarget && linkTarget !== '_self') || url.origin !== window.location.origin || resolved.matched.length === 0) {
			return;
		}

		event.preventDefault();
		router.push(url.pathname + url.search + url.hash);
	};
</script>
