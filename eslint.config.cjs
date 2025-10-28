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
		ignores: [
			'dist/**',
			'test/e2e/results/**',
		],
	},
	{
		plugins: {
			compat,
			html,
		},
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'script',
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
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.jquery,
				Ractive: 'readonly',
				ClipboardJS: 'readonly',
				component: 'readonly',
				google: 'readonly',
			},
		},
		rules: {
			'compat/compat': 'error',
			'no-mixed-spaces-and-tabs': 'error',
			'@stylistic/spaced-comment': 'off',
			'promise/catch-or-return': 'off',
		},
	},
	{
		files: [ 'src/**' ],
		ignores: [
			'src/views/**',
			'src/assets/**',
			'src/public/**',
		],
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
		files: [ 'src/views/**/*.html' ],
		languageOptions: {
			parser: htmlParser,
			globals: {
				app: 'readonly',
			},
		},
		plugins: {
			'@html-eslint': htmlEslint,
		},
	},
	{
		files: [
			'test/e2e/**',
			'src/index.js',
		],
		rules: {
			'no-redeclare': 'off',
		},
	},
]);
