const asnDomains = require('../../lib/asn-to-domain');
const { getDomainLogo } = require('../../lib/logo-processing');

const sendLogo = async (ctx, getLogo, maxAge) => {
	let { padding, size } = ctx.query;

	padding = Number.parseInt(padding);
	padding = Number.isNaN(padding) ? null : Math.min(Math.abs(padding), 48);
	size = Number.parseInt(size);
	size = Number.isNaN(size) ? null : Math.min(Math.max(Math.abs(size), 1), 512);

	let { image, error } = await getLogo(padding, size);

	if (error) {
		ctx.status = error.status;
		ctx.body = { error: error.message };
		return;
	}

	ctx.type = 'image/png';
	ctx.maxAge = maxAge;
	ctx.body = image;
};

module.exports.asnLogo = async (ctx) => {
	let { asn = '' } = ctx.params;

	if (!asn) {
		ctx.status = 400;
		return;
	}

	if (!asnDomains) {
		ctx.status = 503;
		return;
	}

	let domain = asnDomains[asn];

	if (!domain) {
		ctx.status = 404;
		return;
	}

	await sendLogo(ctx, (padding, size) => getDomainLogo(domain, padding, size), 365 * 24 * 60 * 60);
};
