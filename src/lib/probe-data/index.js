const got = require('../got');
const { networkNameToKey, isTagCloudRegion } = require('../../assets/js/_');
const asnToDomain = require('../asn-to-domain');
const countries = require('../../assets/json/countries.json');
const continents = require('../../assets/json/continents.json');
const usaStates = require('../../assets/json/usa-states.json');
const v1TagsUsers = require('./v1-tags-users.json');
const config = require('config');

const serverConfig = config.get('server');
const USERNAME_TAG_PATTERN = /^u-[^:]+$/;
let rawProbeData = null;
let parsedProbeData = {};

const refreshRawProbeData = async () => {
	rawProbeData = await got.get(`${serverConfig.apiHost}/v1/probes`).json().catch(() => null);
};

const updateStatsForNetwork = (networkStatistics, location) => {
	let networkKey = networkNameToKey(location.network);

	if (!networkStatistics[networkKey]) {
		networkStatistics[networkKey] = {
			name: location.network,
			cities: new Set(),
			countries: new Set(),
			continents: Object.create(null),
			probes: 0,
			domain: null,
			logoPromise: null,	// to be created later
		};
	}

	if (!networkStatistics[networkKey].continents[location.continent]) {
		networkStatistics[networkKey].continents[location.continent] = 1;
	} else {
		networkStatistics[networkKey].continents[location.continent]++;
	}

	networkStatistics[networkKey].probes++;
	networkStatistics[networkKey].cities.add(location.city);
	networkStatistics[networkKey].countries.add(location.country);

	if (location.asn && !networkStatistics[networkKey].domain && asnToDomain?.[`AS${location.asn}`]) {
		networkStatistics[networkKey].domain = asnToDomain[`AS${location.asn}`];
	}
};

function createProbeUrls (parsedData, ignoredFields) {
	let testTypes = [ 'ping', 'dns', 'traceroute', 'mtr', 'http' ];

	let dynamicUrls = Object.keys(parsedData)
		.filter(key => !ignoredFields.includes(key))
		.flatMap(key => parsedData[key].flatMap(loc => testTypes.map(tt => `${tt}-from-${loc}`)));

	return [ ...testTypes, ...dynamicUrls ];
}

const parseRawProbeData = () => {
	if (!rawProbeData) {
		return;	// keep old data
	}

	let parsedData = rawProbeData.reduce((res, { tags, location }) => {
		let cityNameAsUrlPart = location.city.split(' ').join('-').toLowerCase();
		let countryNameLC = countries.find(i => i.code.toLowerCase() === location.country.toLowerCase()).name.toLowerCase();
		let countryNameAsUrlPart = countryNameLC.split(' ').join('-');
		let asnName = `as${location.asn}`;
		let networkNameAsUrlPart = location.network.replace(/\./g, '').replace(/[\W]|_/g, ' ').replace(/\s\s+|_/g, ' ').trim().split(' ').join('-').toLowerCase();
		let continentNameLC = continents.find(i => i.code.toLowerCase() === location.continent.toLowerCase()).name.toLowerCase();
		let continentNameAsUrlPart = continentNameLC.split(' ').join('-');
		let regionNameAsUrlPart = location.region.split(' ').join('-').toLowerCase();
		let stateCodeLC = location.state ? location.state.toLowerCase() : null;
		let stateNameLC = stateCodeLC ? usaStates.find(i => i.code.toLowerCase() === stateCodeLC).name.toLowerCase() : null;
		let stateNameAsUrlPart = stateNameLC ? stateNameLC.split(' ').join('-') : null;

		res.cities.add(cityNameAsUrlPart);
		res.asns.add(asnName);
		res.networks.add(networkNameAsUrlPart);
		res.countries.add(countryNameAsUrlPart);
		res.continents.add(continentNameAsUrlPart);
		res.regions.add(regionNameAsUrlPart);
		stateNameAsUrlPart && res.states.add(stateNameAsUrlPart);

		tags.forEach((tag) => {
			let tagLC = tag.toLowerCase();
			isTagCloudRegion(tagLC) && res.cloudRegions.add(tagLC);
		});

		let userTag = tags.filter(tag => USERNAME_TAG_PATTERN.test(tag) && v1TagsUsers.every(b => b === tag || !tag.startsWith(b)))[0];
		userTag && res.users.add(userTag.slice(2));

		updateStatsForNetwork(res.networkStatistics, location);

		return res;
	}, {
		cities: new Set(),
		asns: new Set(),
		networks: new Set(),
		countries: new Set(),
		continents: new Set(),
		regions: new Set(),
		states: new Set(),
		cloudRegions: new Set(),
		users: new Set(),
		networkStatistics: Object.create(null),
	});

	let FIELDS_TO_PRESERVE = [ 'networkStatistics' ];	// other fields are converted to arrays

	parsedData = Object.entries(parsedData).reduce((acc, [ key, val ]) => {
		if (FIELDS_TO_PRESERVE.includes(key)) {
			acc[key] = val;
			return acc;
		}

		acc[key] = Array.from(val);
		return acc;
	}, {});

	parsedData.networkStatistics = Object.entries(parsedData.networkStatistics).reduce((acc, [ key, val ]) => {
		acc[key] = {
			...val,
			cities: val.cities.size,
			countries: val.countries.size,
			continents: Object.entries(val.continents).sort((lhs, rhs) => rhs[1] - lhs[1] || lhs[0].localeCompare(rhs[0])),
		};

		return acc;
	}, Object.create(null));

	parsedData.urls = {
		probes: createProbeUrls(parsedData, FIELDS_TO_PRESERVE),
		users: parsedData.users,
		networks: parsedData.networks,
	};

	parsedProbeData = parsedData;
};

let refreshPromise = null;
let lastRefresh = -1;

const refreshData = async () => {
	if (!refreshPromise) {
		refreshPromise = (async () => {
			await refreshRawProbeData();
			parseRawProbeData();
			lastRefresh = Date.now();
			refreshPromise = null;
		})();
	}

	return refreshPromise;
};

const getParsedProbeData = async (ttl = 1000 * 60) => {
	if (lastRefresh === -1) {
		await refreshData();
	} else if (Date.now() - lastRefresh > ttl) {
		refreshData();	// revalidate in the background
	}

	return parsedProbeData ?? {};
};

module.exports = getParsedProbeData;
module.exports.getNetworkStatistics = async ttl => getParsedProbeData(ttl).then(data => data.networkStatistics);
module.exports.getNetworks = async ttl => getParsedProbeData(ttl).then(data => data.networks);
module.exports.getUsers = async ttl => getParsedProbeData(ttl).then(data => data.users);
module.exports.getDynamicSiteUrls = async ttl => getParsedProbeData(ttl).then(data => data.urls);
