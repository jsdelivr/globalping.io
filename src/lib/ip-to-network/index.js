const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const maxmind = require('maxmind');
const { createIpLookup } = require('./ip-lookup');
const legalNameNormalization = require('globalping-api/dist/src/lib/geoip/legal-name-normalization');

let ipToDomainReader = null;
let ipToLocationReader = null;
let anycastIpv4Lookup = null;
let anycastIpv6Lookup = null;
let nameNormalizationAvailable = false;
let nameNormalizationInited = false;

let ipInfoMmdb = fs.readFileSync(path.join(__dirname, '/../../../data/IPINFO_LITE_ASN.mmdb'));
ipToDomainReader = new maxmind.Reader(ipInfoMmdb);

let maxmindMmdb = fs.readFileSync(path.join(__dirname, '/../../../data/MAXMIND_GEO_LITE2_CITY.mmdb'));
ipToLocationReader = new maxmind.Reader(maxmindMmdb);

anycastIpv4Lookup = createIpLookup('LACES_ANYCAST_IPV4.csv', 'ipv4');
anycastIpv6Lookup = createIpLookup('LACES_ANYCAST_IPV6.csv', 'ipv6');

void legalNameNormalization.populateLegalNames().then(() => {
	nameNormalizationAvailable = true;
}).catch(() => {
	console.error('Failed to initialize legal name normalization.');
}).finally(() => {
	nameNormalizationInited = true;
});

module.exports.isReady = () => !!ipToDomainReader && !!ipToLocationReader && !!anycastIpv4Lookup && !!anycastIpv6Lookup && nameNormalizationInited;

function getLocationByIp (ip) {
	let ipVersion = net.isIP(ip);
	let isAnycast = ipVersion === 4
		? anycastIpv4Lookup?.check(ip)
		: anycastIpv6Lookup?.check(ip);

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
