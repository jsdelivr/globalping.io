// This needs to run before any require() call.
global.apmClient = require('elastic-apm-node').start({});
global.apmClient.addTransactionFilter(require('elastic-apm-utils').apm.transactionFilter());
require('./lib/startup');

const _ = require('lodash');
const config = require('config');
const signalExit = require('signal-exit');
const isSafePath = require('is-safe-path');
const express = require('express');
const zlib = require('zlib');

const Koa = require('koa');
const koaStatic = require('koa-static');
const koaFavicon = require('koa-favicon');
const koaLivereload = require('koa-livereload');
const koaResponseTime = require('koa-response-time');
const koaCompress = require('koa-compress');
const koaLogger = require('koa-logger');
const koaETag = require('koa-etag');
const KoaRouter = require('koa-router');
const koaElasticUtils = require('elastic-apm-utils').koa;
const assetsVersion = require('./lib/assets').version;
const { toNodeListener } = require('h3');

const serverConfig = config.get('server');
const stripTrailingSlash = require('./middleware/strip-trailing-slash');
const render = require('./middleware/render');
const debugHandler = require('./routes/debug');
const globalpingRouter = require('./routes');
const { resolve } = require('node:path');
const isRenderPreview = process.env.IS_PULL_REQUEST === 'true' && process.env.RENDER_EXTERNAL_URL;
let isDev = process.env.NODE_ENV === 'development';

let app = new Koa();
let router = new KoaRouter();
let nuxtRouteHandler = null;

const initNuxt = async () => {
	// nuxt does not support cjs
	let { loadNuxt, build } = await import('nuxt');
	let { writeTypes } = await import('nuxt/kit');

	if (isDev) {
		let nuxt = await loadNuxt({
			ready: true,
			dev: true,
		});

		// create tsconfig
		await writeTypes(nuxt);

		// create .nuxt
		await build(nuxt);

		// get route handler
		nuxtRouteHandler = toNodeListener(nuxt.server.app);
		return;
	}

	// in prod, use the built route
	let { i: useNitroApp } = await import('../.output/server/chunks/nitro/nitro.mjs');
	let nitroApp = useNitroApp();
	nuxtRouteHandler = toNodeListener(nitroApp.h3App);
};

/**
 * Nuxt prod files
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
 * Nuxt routes and files.
 */
router.get(/^\/(nuxt|_nuxt|__nuxt|__nuxt_devtools__)(\/.*)?$/, async (ctx) => {
	if (!nuxtRouteHandler) {
		ctx.status = 404;
		return;
	}

	ctx.status = 200;
	ctx.req.ctx = ctx;
	ctx.respond = false;
	await nuxtRouteHandler(ctx.req, ctx.res);
});


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
	app.use(koaLivereload({ port: 35730 }));
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
	serverHost: app.env === 'production'
		? isRenderPreview
			? process.env.RENDER_EXTERNAL_URL
			: serverConfig.host
		: '',
	assetsHost: app.env === 'production'
		? isRenderPreview
			? `${process.env.RENDER_EXTERNAL_URL}/assets/${assetsVersion}`
			: serverConfig.assetsHost
		: `/assets/${assetsVersion}`,
	apiDocsHost: serverConfig.apiDocsHost,
	logoDevPublicToken: config.get('logoDevPublicToken'),
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
router.get('/debug/status/:status/:maxAge?/:delay?', debugHandler.status);

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
 * Site-specific routes.
 */
router.use(globalpingRouter.routes(), globalpingRouter.allowedMethods());

/**
 * All other pages.
 */
koaElasticUtils.addRoutes(router, [
	[ '/(.*)', '/(.*)' ],
], async (ctx) => {
	let path = ctx.path.startsWith('/_') ? '/_404' : ctx.path;
	let root = '';
	let data = {
		..._.pick(ctx.query, [ 'docs', 'limit', 'page', 'query', 'type', 'style', 'measurement' ]),
		actualPath: ctx.path,
	};

	try {
		ctx.body = await ctx.render(`pages/${root}` + (path === '/' ? '_index' : path) + '.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		if (app.env === 'development') {
			console.error(e);
		}

		ctx.status = 404;
		ctx.body = await ctx.render(`pages/${root}_404.html`, { actualPath: ctx.path });
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
 * Start listening on the configured port.
 */
server.listen(process.env.PORT || serverConfig.port, function () {
	log.info(`Web server started at http://localhost:${this.address().port}, NODE_ENV=${process.env.NODE_ENV}.`);
});

/**
 * Always log before exit.
 */
signalExit((code, signal) => {
	log[code === 0 ? 'info' : 'fatal']('Web server stopped.', { code, signal });
});

/**
 * If we exit because of an uncaught exception, log the error details as well.
 */
process.on('uncaughtException', (error) => {
	log.fatal(`Uncaught exception. Exiting.`, error, { handled: false });

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});

process.on('unhandledRejection', (error) => {
	log.fatal('Unhandled rejection. Exiting.', error, { handled: false });

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});

initNuxt();
