// mac only. see: https://github.com/lovell/sharp/issues/2399#issuecomment-714381300
// process.env.PANGOCAIRO_BACKEND = 'fontconfig';
process.env.FONTCONFIG_PATH = 'fonts';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const { fetchGlobalpingStats, validateMeasurementData } = require('../utils');
const createNetworkOgImage = require('./networks');
const { getNetworkStatistics } = require('../../../lib/probe-data');

const gpGenerators = {
	dns: require('./measurements/dns'),
	http: require('./measurements/http'),
	mtr: require('./measurements/mtr'),
	ping: require('./measurements/ping'),
	traceroute: require('./measurements/traceroute'),
};

const globalpingOG = fs.readFileSync(path.resolve(__dirname, '../../../assets/img/og-globalping.png'));

const render = async (svg) => {
	return sharp(Buffer.from(svg), {
		density: 76.8, // scale from 1200x600 to 1280x640
	})
		.png()
		.toBuffer();
};

module.exports = async (ctx) => {
	try {
		let measData = await fetchGlobalpingStats(ctx.params.id, ctx.app.env);

		if (!validateMeasurementData(measData, false)) {
			ctx.body = globalpingOG;
			ctx.type = 'image/png';
			ctx.maxAge = 60;
			return;
		}

		let svg = await gpGenerators[measData[0].type](ctx, measData);
		ctx.body = await render(svg);
		ctx.type = 'image/png';
		ctx.maxAge = 24 * 60 * 60;
	} catch (error) {
		if (error?.statusCode === 404) {
			return; // 404 response
		}

		throw error;
	}
};

const getStatsForNetwork = async (network) => {
	let allNetworkStatistics = await getNetworkStatistics();
	return allNetworkStatistics?.[network];
};

module.exports.networkSocialImage = async (ctx) => {
	let networkStats = ctx.params.id && await getStatsForNetwork(ctx.params.id);

	if (!networkStats) {
		ctx.body = globalpingOG;
		ctx.type = 'image/png';
		ctx.maxAge = 60;
		return;
	}

	let svg = await createNetworkOgImage(ctx, networkStats);
	ctx.body = await render(svg);
	ctx.type = 'image/png';
	ctx.maxAge = 24 * 60 * 60;
};
