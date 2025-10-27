const globals = require('globals');
const { defineConfig } = require('eslint/config');
const compat = require('eslint-plugin-compat');
const html = require('eslint-plugin-html');
const htmlParser = require('@html-eslint/parser');
const htmlEslint = require('@html-eslint/eslint-plugin');
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
		files: [ 'src/**' ],
		ignores: [ 'src/views/**', 'src/assets/**' ],

		languageOptions: {
			globals: {
				_: 'readonly',
				db: 'readonly',
				log: 'readonly',
				logger: 'readonly',
				redis: 'readonly',
				gtag: 'readonly',
				component: 'readonly',
				Pace: 'readonly',
				browser: 'readonly',
				BASE_URL: 'readonly',
				perfopsRumJs: 'readonly',
			},
		},
	},
	{
		files: [
			'**/*.html',
			'src/assets/**',
		],
		languageOptions: {
			parser: htmlParser,
			globals: {
				...globals.browser,
				...globals.jquery,
				Ractive: 'readonly',
				ClipboardJS: 'readonly',
				component: 'readonly',
				app: 'writable',
				google: 'readonly',
			},
		},
		plugins: {
			'@html-eslint': htmlEslint,
		},
		rules: {
			'@stylistic/spaced-comment': 'off',
		},
	},
]);
