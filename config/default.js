const { version } = require('../package.json');
const { version: assetsVersion } = require('../src/lib/assets');

module.exports = {
	server: {
		port: 13000,
		host: 'https://globalping.io',
		blogHost: 'https://jsdelivr-blog.ghost.io',
		assetsHost: `/assets/${assetsVersion}`,
		apiHost: 'https://api.globalping.io',
		dashboardHost: 'https://dash-directus.globalping.io',
		apiDocsHost: 'https://api.globalping.io',
		userAgent: `globalping.io/${version} (https://github.com/jsdelivr/globalping.io)`,
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Vary': 'Accept-Encoding',
			'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
		},
		blogRewrite: {},
	},
	ipInfoToken: '',
	logoDevPublicToken: '',
};
