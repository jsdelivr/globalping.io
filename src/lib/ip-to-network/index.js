const fs = require('node:fs');
const path = require('node:path');
const maxmind = require('maxmind');
const { parse } = require('csv-parse/sync');
const { IPRangeList } = require('ip-range-list');
const legalNameNormalization = require('globalping-api/dist/src/lib/geoip/legal-name-normalization');

const loadIpRangeList = (...filenames) => {
	let ranges = new IPRangeList();

	for (let filename of filenames) {
		let rawData = fs.readFileSync(path.join(__dirname, `/../../../data/${filename}`));

		let records = parse(rawData.toString('utf8'), {
			skip_empty_lines: true,
		});

		for (let row of records) {
			let subnet = row?.[0]?.trim();

			if (subnet && subnet !== 'prefix') {
				ranges.addSubnet(subnet);
			}
		}
	}

	return ranges;
};

let ipToDomainReader = null;
let ipToLocationReader = null;
let anycastIpLookup = null;
let nameNormalizationAvailable = false;
let nameNormalizationInited = false;

let ipInfoMmdb = fs.readFileSync(path.join(__dirname, '/../../../data/IPINFO_LITE_ASN.mmdb'));
ipToDomainReader = new maxmind.Reader(ipInfoMmdb);

let maxmindMmdb = fs.readFileSync(path.join(__dirname, '/../../../data/MAXMIND_GEO_LITE2_CITY.mmdb'));
ipToLocationReader = new maxmind.Reader(maxmindMmdb);

anycastIpLookup = loadIpRangeList('LACES_ANYCAST_IPV4.csv', 'LACES_ANYCAST_IPV6.csv');

void legalNameNormalization.populateLegalNames().then(() => {
	nameNormalizationAvailable = true;
}).catch(() => {
	console.error('Failed to initialize legal name normalization.');
}).finally(() => {
	nameNormalizationInited = true;
});

module.exports.isReady = () => !!ipToDomainReader && !!ipToLocationReader && !!anycastIpLookup && nameNormalizationInited;

function getLocationByIp (ip) {
	let isAnycast = anycastIpLookup?.check(ip);

	if (isAnycast) {
		return {
			city: null,
			country: null,
			state: null,
			continent: null,
			isAnycast: true,
		};
	}

	let locationResult = ipToLocationReader?.get(ip);

	let city = locationResult?.city?.names?.en || null;
	let country = locationResult?.country?.iso_code || null;
	let state = country === 'US' ? locationResult.subdivisions?.[0]?.iso_code || null : null;
	let continent = locationResult?.continent?.code || null;

	return {
		city,
		country,
		state,
		continent,
		isAnycast: false,
	};
}

module.exports.getNetworkByIp = (ip) => {
	let result = ipToDomainReader?.get(ip);

	let networkName = result?.name
		? nameNormalizationAvailable
			? legalNameNormalization.normalizeLegalName(result.name)
			: result.name
		: null;

	return {
		domain: result?.domain || null,
		name: networkName,
		location: getLocationByIp(ip),
		asn: result?.asn || null,
	};
};
