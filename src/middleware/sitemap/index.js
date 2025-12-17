const fs = require('fs-extra');
const config = require('config');
const path = require('path');
const readDirRecursive = require('recursive-readdir');
const Handlebars = require('handlebars');
const serverHost = config.get('server.host');
const { getDynamicSiteUrls } = require('../../lib/probe-data');
const viewsPath = __dirname + '/../../views';
const nuxtPagesPath = __dirname + '/../../../app/pages';

let siteMapTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap.xml', 'utf8'));
let siteMap0Template = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-0.xml', 'utf8'));
let siteMapIndexTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-index.xml', 'utf8'));

module.exports = async (ctx) => {
	ctx.params.page = ctx.params.page.replace(/\.xml$/, '');
	let pages = (await readDirRecursive(viewsPath + '/pages', [ '_*' ])).map(p => path.relative(viewsPath + '/pages', p).replace(/\\/g, '/').slice(0, -5));
	let nuxtPages = (await readDirRecursive(nuxtPagesPath, [ '_*' ])).map(p => path.relative(nuxtPagesPath, p).replace(/\\/g, '/').slice(0, -4));
	pages = [ ...pages, ...nuxtPages ];
	let urls = await getDynamicSiteUrls();
	let probesStartIncl = 3;
	let probesEndExclus = Math.ceil(urls.probes.length / 50000) + probesStartIncl;
	let page = Number(ctx.params.page);

	if (ctx.params.page === 'index') {
		ctx.body = siteMapIndexTemplate({ serverHost, maps: _.range(1, probesEndExclus) });
	} else if (page >= probesStartIncl && page < probesEndExclus) {
		ctx.body = siteMapTemplate({ probes: urls.probes.slice((page - probesStartIncl) * 50000, (page - probesStartIncl + 1) * 50000) });
	} else if (page === 2) {
		ctx.body = siteMapTemplate({ networks: urls.networks });
	} else if (page === 1) {
		ctx.body = siteMapTemplate({ users: urls.users });
	} else if (page === 0) {
		ctx.body = siteMap0Template({ serverHost, pages });
	} else {
		ctx.status = 404;
	}

	ctx.type = 'xml';
	ctx.maxAge = 24 * 60 * 60;
};
