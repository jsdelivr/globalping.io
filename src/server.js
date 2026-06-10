// This needs to run before any require() call.
const apm = require('elastic-apm-node');
const apmUtils = require('elastic-apm-utils');
apmUtils.apm.useConstrainedResources();

if (!global.apmClient) {
	global.apmClient = apm.start({});
	global.apmClient.addTransactionFilter(apmUtils.apm.transactionFilter());
}

require('./lib/startup');

const lodash = require('lodash');
const config = require('config');
const { resolve } = require('node:path');
const isSafePath = require('is-safe-path');
const express = require('express');
const zlib = require('zlib');

const Koa = require('koa');
const koaStatic = require('koa-static');
const koaFavicon = require('koa-favicon');
const koaResponseTime = require('koa-response-time');
const koaCompress = require('koa-compress');
const koaLogger = require('koa-logger');
const koaETag = require('@koa/etag');
const KoaRouter = require('@koa/router');
const koaElasticUtils = require('elastic-apm-utils').koa;
const assetsVersion = require('./lib/assets').version;
const captureNodeResponse = require('./lib/nuxt/captureNodeResponse');
const initializeNuxt = require('./lib/nuxt/initialize');

const serverConfig = config.get('server');
const stripTrailingSlash = require('./middleware/strip-trailing-slash');
const render = require('./middleware/render');
const debugHandler = require('./routes/debug');
const globalpingRouter = require('./routes');
const coolifyUrl = (process.env.COOLIFY_URL || '').split(/[\s,]+/)[0].replace(/\/+$/, '');
const isDev = process.env.NODE_ENV === 'development';

let app = new Koa();
let router = new KoaRouter();

const shouldLogRenderError = (ctx, error) => {
	return !(ctx.path.startsWith('/.well-known') && error?.code === 'ENOENT');
};

const serverHost = app.env === 'production'
	? coolifyUrl || serverConfig.host
	: '';

const assetsHost = app.env === 'production'
	? coolifyUrl ? `${coolifyUrl}/assets/${assetsVersion}` : serverConfig.assetsHost
	: `/assets/${assetsVersion}`;

const logoHost = coolifyUrl
	? `${coolifyUrl}/domain-logo`
	: serverConfig.logoHost;

const nuxtRouteHandlerPromise = initializeNuxt().catch((err) => {
	console.error(err);
	return null;
});

/**
 * Nuxt production-only files
 */
if (!isDev) {
	router.use(
		'/_nuxt',
		koaStatic(resolve(__dirname, '../.output/public/'), {
			index: false,
			maxage: 31536000000,
			setHeaders (res) {
				res.set('Cache-Control', 'public, max-age=31536000, immutable');
			},
		}),
	);
}

/**
 * Server config.
 */
app.name = serverConfig.name;
app.keys = serverConfig.keys;
app.silent = app.env === 'production';
app.proxy = true;

/**
 * Set default headers.
 */
app.use(async (ctx, next) => {
	ctx.set(serverConfig.headers);
	return next();
});

/**
 * Handle favicon requests before anything else.
 */
app.use(koaFavicon(`${__dirname}/public/icons/favicon.ico`));

/**
 * Log requests during development.
 */
if (app.env === 'development') {
	app.use(koaLogger({
		logger,
		useLevel: 'debug',
	}));
}

/**
 * Add a X-Response-Time header.
 */
app.use(koaResponseTime());

/**
 * Gzip compression.
 */
app.use(koaCompress({ br: { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } } }));

/**
 * ETag support.
 */
// app.use(koaConditionalGet());
app.use(koaETag());

/**
 * Security: prevent directory traversal.
 */
app.use(async (ctx, next) => {
	if (isSafePath(ctx.path) && ctx.path.charAt(1) !== '/') {
		return next();
	}

	ctx.status = 403;
});

/**
 * Livereload support during development.
 */
if (app.env === 'development') {
	app.use(require('koa-livereload')({ port: 35730 }));
}

/**
 * Normalize URLs.
 */
app.use(stripTrailingSlash());

/**
 * Easier caching.
 */
app.use(async (ctx, next) => {
	await next();

	if (!ctx.res.allowCaching) {
		return;
	}

	if (!ctx.maxAge && ctx.status === 301) {
		ctx.maxAge = 24 * 60 * 60;
	}

	if (ctx.maxAge) {
		ctx.set('Cache-Control', `public, max-age=${ctx.maxAge}, must-revalidate, stale-while-revalidate=600, stale-if-error=86400`);
	} else if (ctx.expires) {
		ctx.set('Cache-Control', `public`);
		ctx.set('Expires', ctx.expires);
	}
});

/**
 * Ractive integration.
 */
app.use(render({
	views: __dirname + '/views/',
	cache: app.env !== 'development',
	serverHost,
	assetsHost,
	logoHost,
	apiDocsHost: serverConfig.apiDocsHost,
	assetsVersion,
}, app));

/**
 * More accurate APM route names.
 */
router.use(koaElasticUtils.middleware(global.apmClient));

/**
 * Static files.
 */
router.use(
	'/assets/:v',
	async (ctx, next) => {
		ctx.set('X-Robots-Tag', 'noindex');

		ctx.originalPath = ctx.path;
		ctx.path = ctx.path.replace(/^\/[^/]+\/[^/]+/, '') || '/';

		if (app.env === 'production' && ctx.params.v === assetsVersion) {
			ctx.res.allowCaching = true;
		}

		return next();
	},
	koaStatic(__dirname + '/../dist/assets', {
		index: false,
		maxage: 365 * 24 * 60 * 60 * 1000,
		setHeaders (res) {
			if (res.allowCaching) {
				res.set('Cache-Control', 'public, max-age=31536000');
			} else {
				res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
			}
		},
	}),
	async (ctx) => {
		ctx.path = ctx.originalPath;
		// return next();
	},
);

router.use(koaStatic(__dirname + '/../dist', {
	index: false,
	maxage: 60 * 60 * 1000,
	setHeaders (res) {
		res.set('Cache-Control', 'public, max-age=3600');
	},
}));

router.use(async (ctx, next) => {
	ctx.res.allowCaching = ctx.res.allowCaching || (app.env === 'production' && !ctx.query.v);
	return next();
});

/**
 * Canonical links
 */
router.use(async (ctx, next) => {
	await next();

	if (ctx.status < 300) {
		ctx.append('Link', `<${serverConfig.host}${ctx.path}>; rel="canonical"`);
	}
});

/**
 * Debug endpoints.
 */
router.get('/debug/' + serverConfig.debugToken, debugHandler);
router.get('/debug/status/:status/{/:maxAge}{/:delay}', debugHandler.status);

/**
 * Auth callback
 */
router.get('/auth/callback', '/auth/callback', async (ctx) => {
	let url = new URL(serverConfig.host);
	let redirect = ctx.query.redirect || '/';
	let redirectUrl = new URL(redirect, serverConfig.host);

	if (redirectUrl.origin !== url.origin) {
		redirectUrl = url;
	}

	ctx.redirect(redirectUrl.toString());
});

/**
 * Nuxt routes and files.
 */
const NUXT_DEV_ONLY_ROUTES = [ '/__nuxt_devtools__' ];
const NUXT_PROD_ONLY_ROUTES = [];
const NUXT_ROUTES = [ '/integrations', '/leaderboard', '/discord', '/slack', '/cli', '/about-us', '/_nuxt', ...isDev ? NUXT_DEV_ONLY_ROUTES : NUXT_PROD_ONLY_ROUTES ];

router.use(async (ctx, next) => {
	if (NUXT_ROUTES.some(route => ctx.req.path.startsWith(`${route}/`) || ctx.req.path === route)) {
		let handler = await nuxtRouteHandlerPromise;

		if (!handler) {
			ctx.status = 404;
			return next();
		}

		ctx.status = 200;
		ctx.req.ctx = ctx;

		if (isDev) {
			handler(ctx.req, ctx.res);
			ctx.respond = false;
			return;
		}

		return captureNodeResponse(handler, ctx);
	}

	return next();
});

/**
 * Site-specific routes.
 */
router.use(globalpingRouter.routes(), globalpingRouter.allowedMethods());

/**
 * All other pages.
 */
koaElasticUtils.addRoutes(router, [
	[ '{/*path}', '{/*path}' ],
], async (ctx) => {
	let path = ctx.path.startsWith('/_') ? '/_404' : ctx.path;
	let root = '';
	let data = {
		...lodash.pick(ctx.query, [ 'docs', 'limit', 'page', 'query', 'type', 'style', 'measurement' ]),
	};

	try {
		ctx.body = await ctx.render(`pages/${root}` + (path === '/' ? '_index' : path) + '.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		if (app.env === 'development' && shouldLogRenderError(ctx, e)) {
			console.error(e);
		}

		ctx.status = 404;
		ctx.body = await ctx.render(`pages/${root}_404.html`);
	}
});

/**
 * Routing.
 */
app.use(router.routes()).use(router.allowedMethods());

/**
 * Koa error handling.
 */
app.on('error', (error, ctx) => {
	let ignore = [ 'ECONNABORTED', 'ECONNRESET', 'EPIPE' ];

	if ((error.status && error.status < 500) || ignore.includes(error.code)) {
		return;
	}

	log.error('Koa server error.', error, { ctx });
});


/**
 * Main Express server.
 */
let server = express();

server.enable('trust proxy');
server.enable('strict routing');
server.enable('case sensitive routing');
server.disable('query parser');
server.disable('x-powered-by');
server.disable('etag');

/**
 * Redirect /blog to /blog/.
 */
server.use((req, res, next) => {
	if (req.path === '/blog') {
		return res.redirect(`${req.path}/`);
	}

	next();
});

/**
 * Forward everything else to Koa (main website).
 */
server.use(app.callback());

/**
 * Export without listening so the entrypoint can run one or more workers.
 */
module.exports = server;
