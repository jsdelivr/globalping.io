const countries = require('../../json/countries.json');
const continents = require('../../json/continents.json');
const states = require('../../json/usa-states.json');

const normalizeValue = value => String(value ?? '').trim().toLowerCase();
const formatAsn = asn => `AS${asn}`;

// What the API's any-ascii produces for common letters and marks without a Unicode decomposition.
const ASCII_REPLACEMENTS = { 'æ': 'ae', 'ð': 'd', 'ø': 'o', 'þ': 'th', 'ß': 'ss', 'đ': 'd', 'ħ': 'h', 'ı': 'i', 'ł': 'l', 'ŋ': 'ng', 'œ': 'oe', 'ŧ': 't', 'ə': 'e', '‘': '\'', '’': '\'', '“': '"', '”': '"', '–': '-', '—': '-' };
const ASCII_REPLACEMENT_PATTERN = new RegExp(`[${Object.keys(ASCII_REPLACEMENTS).join('')}]`, 'g');

const toAsciiLowerCase = value => value.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
	.replace(ASCII_REPLACEMENT_PATTERN, character => ASCII_REPLACEMENTS[character]);

const countryNameByCode = new Map(countries.map(country => [ country.code, country.name ]));
const continentNameByCode = new Map(continents.map(continent => [ continent.code, continent.name ]));
const stateNameByCode = new Map(states.map(state => [ state.code, state.name ]));

const getCountryName = code => countryNameByCode.get(code);
const getContinentName = code => continentNameByCode.get(code);
const getStateName = code => stateNameByCode.get(code);

const LOCATION_FIELDS = [ 'continent', 'region', 'country', 'state', 'city', 'asn', 'network', 'tags' ];

// Keep these tables aligned with globalping-api/src/lib/location/{regions,networks}. Country names and aliases
// come from countries.json, which follows the countries-list package the API matches.
const REGIONS = [
	'Northern Africa',
	'Eastern Africa',
	'Middle Africa',
	'Southern Africa',
	'Western Africa',
	'Antarctica',
	'Caribbean',
	'Central America',
	'South America',
	'Northern America',
	'Central Asia',
	'Eastern Asia',
	'South-eastern Asia',
	'Southern Asia',
	'Western Asia',
	'Eastern Europe',
	'Northern Europe',
	'Southern Europe',
	'Western Europe',
	'Australia and New Zealand',
	'Melanesia',
	'Micronesia',
	'Polynesia',
];

const REGION_ALIASES = [
	[ 'northern africa', 'north africa' ],
	[ 'eastern africa', 'east africa' ],
	[ 'western africa', 'west africa' ],
	[ 'south america', 'southern america' ],
	[ 'eastern asia', 'east asia' ],
	[ 'south-eastern asia', 'south-east asia' ],
	[ 'southern asia', 'south asia' ],
	[ 'western asia', 'west asia' ],
	[ 'eastern europe', 'east europe' ],
	[ 'northern europe', 'north europe' ],
	[ 'southern europe', 'south europe' ],
	[ 'western europe', 'west europe' ],
];

const NETWORK_ALIASES = [
	[ 'amazon.com', 'amazon technologies' ],
	[ 'vultr', 'choopa' ],
	[ 'netia', 'internetia' ],
];

// The API matches country names and aliases folded to ASCII.
const asciiCountries = countries.map(country => ({ ...country, name: toAsciiLowerCase(country.name), aliases: (country.aliases ?? []).map(toAsciiLowerCase) }));
const asciiCountryByCode = new Map(asciiCountries.map(country => [ country.code, country ]));
const getAsciiCountry = code => asciiCountryByCode.get(code);

const getAliasGroup = (groups, value) => groups.find(group => group.includes(value.toLowerCase())) ?? [];

const getPrefixes = (value, separator) => {
	let parts = value.split(separator);

	return parts.map((_part, index) => parts.slice(0, index + 1).join(separator));
};

// Like the API, known values are only lowercased while probe values and keywords also turn '-' into ' ',
// so a known value containing '-' never matches exactly.
const toKnownValues = values => new Set(values.filter(Boolean).map(value => value.toLowerCase()));
const toIndexValues = values => new Set(values.filter(Boolean).map(value => value.toLowerCase().replaceAll('-', ' ')));

// The order follows the API's magic selector precedence. Categories with known values match exactly only those,
// so they keep their meaning even when no returned probe has them; the others match the returned probes' values.
const MAGIC_CATEGORIES = [
	{ knownValues: toKnownValues(asciiCountries.map(country => country.code)), getValues: probe => [ probe.country ] },
	{ knownValues: toKnownValues(asciiCountries.map(country => country.iso3)), getValues: probe => [ getAsciiCountry(probe.country)?.iso3 ] },
	{ knownValues: toKnownValues(asciiCountries.map(country => country.name)), getValues: probe => [ getAsciiCountry(probe.country)?.name ] },
	{ knownValues: toKnownValues(asciiCountries.flatMap(country => country.aliases)), getValues: probe => getAsciiCountry(probe.country)?.aliases ?? [] },
	{ getValues: probe => [ probe.city ] },
	{ knownValues: toKnownValues(states.map(state => state.code)), getValues: probe => [ probe.state ] },
	{ knownValues: toKnownValues(states.map(state => `US-${state.code}`)), getValues: probe => probe.state ? [ `US-${probe.state}` ] : [] },
	{ knownValues: toKnownValues(states.map(state => state.name)), getValues: probe => [ getStateName(probe.state) ] },
	{ knownValues: toKnownValues(continents.map(continent => continent.code)), getValues: probe => [ probe.continent ] },
	{ knownValues: toKnownValues(continents.map(continent => continent.name)), getValues: probe => [ getContinentName(probe.continent) ] },
	{ knownValues: toKnownValues(REGIONS), getValues: probe => [ probe.region ] },
	{ knownValues: toKnownValues(REGION_ALIASES.flat()), getValues: probe => getAliasGroup(REGION_ALIASES, probe.region) },
	{ matchesExactly: keyword => /^as\d+$/.test(keyword), getValues: probe => [ formatAsn(probe.asn) ] },
	{ getValues: probe => probe.tags.filter(tag => !tag.startsWith('u-')).flatMap(tag => getPrefixes(tag, '-')) },
	{ getValues: probe => getPrefixes(probe.network.toLowerCase(), ' ') },
	{ knownValues: toKnownValues(NETWORK_ALIASES.flat()), getValues: probe => getAliasGroup(NETWORK_ALIASES, probe.network) },
];

// The API folds the magic value to ASCII and ignores empty words.
const getMagicKeywords = magic => toAsciiLowerCase(magic).split('+')
	.map(value => ({ system: value.replaceAll('-', ' ').trim(), userTag: value.trim() }))
	.filter(({ system }) => system);

const getRequestedValues = (location, field) => [ location[field] ?? [] ].flat();

const matchesStaticLocation = (probe, location) => LOCATION_FIELDS.every((field) => {
	let values = [ probe[field] ].flat().map(normalizeValue);

	return getRequestedValues(location, field).every(value => values.includes(normalizeValue(value)));
});

const getKeywordPrecedence = ({ categoryIndex }) => categoryIndex < 0 ? Infinity : categoryIndex;

const matchProbesToLocations = (probes, locations) => {
	let indexedProbes = probes.map(probe => ({
		probe,
		valuesByCategory: MAGIC_CATEGORIES.map(category => toIndexValues(category.getValues(probe))),
	}));

	let findExactCategoryIndex = keyword => MAGIC_CATEGORIES.findIndex(({ knownValues, matchesExactly }, categoryIndex) => {
		if (knownValues) {
			return knownValues.has(keyword);
		}

		return matchesExactly ? matchesExactly(keyword) : indexedProbes.some(({ valuesByCategory }) => valuesByCategory[categoryIndex].has(keyword));
	});

	return locations.map((location) => {
		let keywords = getMagicKeywords(location.magic ?? '')
			.map(keyword => ({ ...keyword, categoryIndex: findExactCategoryIndex(keyword.system) }))
			.sort((a, b) => getKeywordPrecedence(a) - getKeywordPrecedence(b));

		let matching = indexedProbes;

		for (let { system, userTag, categoryIndex } of keywords) {
			let filtered = matching.filter(({ valuesByCategory }) => categoryIndex >= 0
				? valuesByCategory[categoryIndex].has(system)
				: valuesByCategory.some(values => [ ...values ].some(value => value.includes(system))));

			if (!filtered.length && userTag.startsWith('u-')) {
				filtered = matching.filter(({ probe }) => probe.tags.some(tag => normalizeValue(tag) === userTag));
			}

			matching = filtered;
		}

		return matching.map(({ probe }) => probe).filter(probe => matchesStaticLocation(probe, location));
	});
};

const FIELD_VALUE_LABELS = { continent: getContinentName, country: getCountryName, state: getStateName, asn: formatAsn };

const getFieldValueLabel = (field, value) => FIELD_VALUE_LABELS[field]?.(value) || value;

const getLocationLabel = (location) => {
	let parts = location.magic ? [ location.magic.trim() ] : [];

	for (let field of LOCATION_FIELDS) {
		let values = getRequestedValues(location, field);

		if (values.length) {
			parts.push(values.map(value => getFieldValueLabel(field, value)).join(' + '));
		}
	}

	return parts.join(' · ') || 'All locations';
};

const isWorldLocation = location => location.magic?.toLowerCase() === 'world';

module.exports = { formatAsn, getContinentName, getCountryName, getLocationLabel, getStateName, isWorldLocation, matchProbesToLocations };
