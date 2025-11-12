import tailwindcss from '@tailwindcss/vite';
import config from 'config';
import assets from './src/lib/assets/index';
const version = assets.version;

const isRenderPreview = process.env.IS_PULL_REQUEST === 'true' && process.env.RENDER_EXTERNAL_URL;

const serverConfig: ServerConfig = config.get('server');

const serverHost = process.env.NODE_ENV === 'production'
	? isRenderPreview
		? process.env.RENDER_EXTERNAL_URL
		: serverConfig.host
	: '';

const assetsHost = process.env.NODE_ENV === 'production'
	? isRenderPreview
		? `${process.env.RENDER_EXTERNAL_URL}/assets/${version}`
		: serverConfig.assetsHost
	: `/assets/${version}`;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-11-12',
	runtimeConfig: {
		public: {
			serverHost,
			assetsHost,
			apiDocsHost: serverConfig.apiDocsHost,
			assetsVersion: version,
			apiHost: serverConfig.apiHost,
			dashboardHost: serverConfig.dashboardHost,
		},
	},
	app: {
		baseURL: '/new',
		head: {
			title: 'Globalping - Internet and web infrastructure monitoring and benchmarking',
			meta: [
				{ charset: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ name: 'theme-color', content: '#ffffff' },
				{ name: 'description', content: 'Run free latency tests and network commands like ping, traceroute, HTTP and DNS resolve on probes located worldwide.' },
				{ name: 'keywords', content: 'globalping, jsdelivr, free, open source, oss' },

				{ property: 'og:title', content: 'Globalping - Internet and web infrastructure monitoring and benchmarking' },
				{ property: 'og:description', content: 'Run free latency tests and network commands like ping, traceroute, HTTP and DNS resolve on probes located worldwide.' },
				{ property: 'og:type', content: 'website' },
				{ property: 'og:url', content: serverHost || 'https://globalping.io' },
				{ property: 'og:image', content: `${assetsHost}/img/og-globalping.png` },
				{ property: 'og:image:secure_url', content: `${assetsHost}/img/og-globalping.png` },
				{ property: 'og:image:width', content: 1280 },
				{ property: 'og:image:height', content: 640 },
				{ property: 'og:site_name', content: 'Globalping' },
				{ property: 'og:locale', content: 'en_US' },

				{ name: 'twitter:card', content: 'summary_large_image' },
				{ name: 'twitter:title', content: 'Globalping - Internet and web infrastructure monitoring and benchmarking' },
				{ name: 'twitter:description', content: 'Run free latency tests and network commands like ping, traceroute, HTTP and DNS resolve on probes located worldwide.' },
				{ name: 'twitter:image', content: `${assetsHost}/img/og-globalping.png` },
				{ name: 'twitter:site', content: '@jsdelivr' },
				{ name: 'twitter:creator', content: '@jsdelivr' },

				{ name: 'application-name', content: 'Globalping' },
				{ name: 'apple-mobile-web-app-title', content: 'Globalping' },
				{ name: 'msapplication-TileColor', content: '#ffffff' },
				{ name: 'msapplication-config', content: '/icons/browserconfig.xml' },
			],
			link: [
				{ rel: 'icon', type: 'image/x-icon', href: '/icons/favicon.ico' },
				{ rel: 'icon', type: 'image/svg+xml', href: '/icons/favicon.ico' },
				{ rel: 'icon', type: 'image/png', href: '/icons/favicon-48x48.png', sizes: '48x48' },
				{ rel: 'icon', type: 'image/png', href: '/icons/favicon-32x32.png', sizes: '32x32' },
				{ rel: 'icon', type: 'image/png', href: '/icons/favicon-16x16.png', sizes: '16x16' },
				{ rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png', sizes: '180x180' },
				{ rel: 'manifest', href: '/icons/site.webmanifest' },
				{ rel: 'mask-icon', color: '#0f172a', href: '/icons/safari-pinned-tab.svg' },
				{ rel: 'dns-prefetch', href: 'https://cdn.jsdelivr.net' },
				{ rel: 'preconnect', href: 'https://cdn.jsdelivr.net/' },
				{ rel: 'sitemap', type: 'application/xml', href: '/sitemap/index.xml' },
				{ rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css' },
			],
			script: [
				{ src: 'https://cdn.jsdelivr.net/npm/jquery@3.6.3/dist/jquery.slim.min.js', defer: false },
				{ src: 'https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.js', defer: false },
			],
		},
	},
	css: [
		'~/assets/css/main.css',
	],
	devtools: { enabled: true },
	vite: {
		plugins: [
			tailwindcss(),
		],
	},
});
