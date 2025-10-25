const { defineConfig } = require('eslint/config');
const compat = require('eslint-plugin-compat');
const html = require('eslint-plugin-html');
const htmlParser = require('@html-eslint/parser');
const globals = require('globals');
const javascript = require('@martin-kolarik/eslint-config');

module.exports = defineConfig([
	javascript,
	{
		ignores: [ 'dist/**' ],
	},
	{
		plugins: {
			compat,
			html,
		},
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'script',
			globals: {
				...globals.browser,
				...globals.jquery,
				_: false,
				db: false,
				log: false,
				logger: false,
				Ractive: false,
				redis: false,
				ClipboardJS: false,
				gtag: false,
				component: false,
				Pace: false,
				google: false,
				browser: false,
				BASE_URL: false,
				perfopsRumJs: false,
				app: true,
			},
		},
	},
	{
		files: [
			'src/assets/**',
			'src/public/**',
			'src/views/**',
		],

		settings: {
			lintAllEsApis: true,
			polyfills: [],
		},

		rules: {
			'compat/compat': [
				'error',
			],
			'promise/catch-or-return': [
				'off',
			],
		},
	},
	{
		files: [
			'**/*.html',
		],
		languageOptions: {
			parser: htmlParser,
		},
		rules: {
			'spaced-comment': [
				'off',
			],
		},
	},
]);
