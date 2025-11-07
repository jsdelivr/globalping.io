import tailwindcss from '@tailwindcss/vite';
import config from 'config';
const { version } = (await import('./src/lib/assets')).default;

const isRenderPreview = process.env.IS_PULL_REQUEST === 'true' && process.env.RENDER_EXTERNAL_URL;

const serverConfig = config.get('server');

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


const apiDocsHost = serverConfig.apiDocsHost;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	runtimeConfig: {
		public: {
			serverHost,
			assetsHost,
			apiDocsHost,
			assetsVersion: version,
		},
	},
	app: {
		baseURL: '/new',
		head: {
			script: [
				{ src: 'https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js', defer: false },
				{ src: 'https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/js/bootstrap.min.js', defer: false },
			],
		},
	},
	css: [
		'~/../dist/assets/css/app.css',
		// '~/assets/css/main.css',
	],
	devtools: { enabled: true },
	modules: [
		'@nuxt/eslint',
	],
	vite: {
		plugins: [
			tailwindcss(),
		],
	},
});
