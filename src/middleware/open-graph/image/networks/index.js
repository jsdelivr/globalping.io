const fs = require('node:fs');
const config = require('config');
const got = require('../../../../lib/got');
const path = require('node:path');

const continents = require('../../../../assets/json/continents.json');
const { pluralize } = require('../../../../assets/js/_');
const { fontsProcessor, truncateString } = require('../utils');

const logoDevPublicToken = config.get('logoDevPublicToken');

let globeBase64 = null;

const getGlobeImage = () => {
	if (globeBase64) {
		return globeBase64;
	}

	let imagePath = path.join(__dirname, '../../../../views/open-graph/networks-globe.png');

	try {
		let fileBuffer = fs.readFileSync(imagePath);
		globeBase64 = `data:image/png;base64,${fileBuffer.toString('base64')}`;
		return globeBase64;
	} catch (err) {
		console.error(err);
		return '';
	}
};

const fetchNetworkLogo = async (domain) => {
	if (!domain || !logoDevPublicToken) {
		return null;
	}

	let logoUrl = `https://img.jsdelivr.com/img.logo.dev/${encodeURIComponent(domain)}`;

	try {
		let response = await got.get(logoUrl, {
			responseType: 'buffer',
			searchParams: {
				token: logoDevPublicToken,
			},
		});

		let buffer = response.body;
		let contentType = response.headers['content-type'] || 'image/png';

		return `data:${contentType};base64,${buffer.toString('base64')}`;
	} catch (err) {
		console.error(err);
		return null;
	}
};

const getNetworkLogo = async (networkStats) => {
	let fetchedThisCall = false;

	if (!networkStats.logoPromise) {
		fetchedThisCall = true;
		networkStats.logoPromise = fetchNetworkLogo(networkStats.domain);
	}

	let logo = await networkStats.logoPromise;

	// revalidate
	if (!logo && !fetchedThisCall) {
		networkStats.logoPromise = fetchNetworkLogo(networkStats.domain);
		logo = await networkStats.logoPromise;
	}

	return logo;
};

const getNetworkFieldParams = (fieldCount, fieldTitle, fieldTitlePlural, shift = 88) => {
	let PADDING = 16;
	let GAP = 12;
	let ICON_WIDTH = 32;

	let text = pluralize(fieldTitle, fieldTitlePlural, fieldCount);
	let countText = String(fieldCount);

	let textWidth = fontsProcessor.computeWidth(text, 'Lexend Regular', 32, 0.2);
	let countWidth = fontsProcessor.computeWidth(countText, 'Lexend SemiBold', 32, 0.2);

	return {
		name: fieldTitlePlural,
		title: text,
		width: 2 * PADDING + 3 * GAP + ICON_WIDTH + textWidth + countWidth,
		count: fieldCount,
		countWidth,
		shift,
	};
};

const getNetworkContinentFieldParams = (continent) => {
	let PADDING = 16;
	let GAP = 10;
	let [ code, count ] = continent;
	let name = continents.find(continent => continent.code === code)?.name ?? code;

	let textWidth = fontsProcessor.computeWidth(name, 'Lexend SemiBold', 32, 0.2);
	let countWidth = fontsProcessor.computeWidth(`(${count})`, 'Lexend Regular', 32, -0.6);

	return {
		name,
		count,
		width: 2 * PADDING + GAP + textWidth + countWidth,
		textWidth,
	};
};

const addShiftToContinentsRow = (continentsRow, gap, shift = 88) => {
	let currentShift = shift;

	for (let continent of continentsRow) {
		continent.shift = currentShift;
		currentShift += continent.width + gap;
	}
};

module.exports = async (ctx, networkStats) => {
	let CELL_GAP = 16;

	// truncate header, if necessary
	let networkName = truncateString(networkStats.name, 'Lexend SemiBold', 72, 892, 0.2).text;

	// calculate subheader field positions
	let subheaderFields = [{ sg: 'probe', pl: 'probes' }, { sg: 'city', pl: 'cities' }, { sg: 'country', pl: 'countries' }];

	subheaderFields.forEach(({ sg, pl }, index) => {
		let shift = index === 0 ? 88 : subheaderFields[index - 1].shift + subheaderFields[index - 1].width + CELL_GAP;
		// replace with actual values
		subheaderFields[index] = getNetworkFieldParams(networkStats[pl], sg, pl, shift);
	});

	// calculate continent field positions
	let MAX_ROW_LENGTH = 864;
	let addToFirstRow = true;
	let continentsFirstRow = [];
	let continentsSecondRow = [];

	for (let continent of networkStats.continents) {
		let continentFieldParams = getNetworkContinentFieldParams(continent);
		addToFirstRow = addToFirstRow
			&& (continentFieldParams.width + continentsFirstRow.reduce((sum, { width }) => sum + width, 0) + CELL_GAP * continentsFirstRow.length) <= MAX_ROW_LENGTH;

		if (addToFirstRow) {
			continentsFirstRow.push(continentFieldParams);
		} else {
			continentsSecondRow.push(continentFieldParams);
		}
	}

	addShiftToContinentsRow(continentsFirstRow, CELL_GAP);
	addShiftToContinentsRow(continentsSecondRow, CELL_GAP);

	// get logo
	let logo = await getNetworkLogo(networkStats);

	return ctx.render('open-graph/networks.svg', {
		networkName,
		subheaderFields,
		continentsFirstRow,
		continentsSecondRow,
		logo,
		globeImage: getGlobeImage(),
	});
};
