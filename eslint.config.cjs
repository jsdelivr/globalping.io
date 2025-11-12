const globals = require('globals');
const compat = require('eslint-plugin-compat');
const html = require('eslint-plugin-html');
const htmlParser = require('@html-eslint/parser');
const htmlEslint = require('@html-eslint/eslint-plugin');
const javascript = require('@martin-kolarik/eslint-config');
const typescript = require('@martin-kolarik/eslint-config/typescript.js');
const { createConfigForNuxt } = require('@nuxt/eslint-config');
const tailwindcss = require('eslint-plugin-tailwindcss');
const path = require("node:path");

javascript[0].ignores = [ 'app/**', '**.ts', '**.vue' ];

module.exports = createConfigForNuxt().prepend(
	...tailwindcss.configs['flat/recommended'],
	typescript.forFiles([ '**/*.ts', '**/*.vue' ]),
).append(
	javascript,
	{
		ignores: [
			'dist/**',
			'app/ractive/*.js',
			'test/e2e/results/**',
			'.output',
		],
	},
	// Nuxt rules
	{
		files: [ 'app/*/**' ],
		rules: {
			'import/order': [ 'error', {
				distinctGroup: false,
				pathGroups: [
					{
						pattern: '#**',
						group: 'external',
						position: 'before',
					},
				],
				alphabetize: {
					order: 'asc',
				},
			}],

			// Preset overrides.
			'prefer-let/prefer-let': 'off',
			'camelcase': 'off',
			'jsonc/no-comments': 'off',
			'n/no-missing-import': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
	},
	{
		files: [
			'{app,server}/**/*.{ts,vue}',
		],
		rules: {
			'import/extensions': [ 'error', 'never' ],
		},
	},
	{
		files: [
			'**/*.vue',
		],
		rules: {
			'@stylistic/indent': 'off',
			'vue/component-tags-order': 'off',
			'vue/block-order': [ 'error', {
				order: [ 'template', 'script', 'style' ],
			}],
			'vue/html-indent': [
				'error',
				'tab',
				{
					baseIndent: 1,
				},
			],
			'vue/script-indent': [
				'error',
				'tab',
				{
					baseIndent: 1,
					switchCase: 1,
				},
			],
			'vue/html-closing-bracket-spacing': [
				'error',
				{
					selfClosingTag: 'never',
				},
			],
			'vue/max-attributes-per-line': [ 'error', {
				singleline: {
					max: 5,
				},
				multiline: {
					max: 1,
				},
			}],
			'vue/singleline-html-element-content-newline': 'off',
			'tailwindcss/no-custom-classname': 'off',
		},
	},
	// Ractive + js rules
	{
		files: [
			'src/**',
		],
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
);
