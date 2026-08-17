'use strict';

const countries = require('../../json/countries.json');
const continents = require('../../json/continents.json');
const states = require('../../json/usa-states.json');

const COUNTRIES_BY_CODE = Object.fromEntries(countries.map(country => [ country.code, country.name ]));
const CONTINENTS_BY_CODE = Object.fromEntries(continents.map(continent => [ continent.code, continent.name ]));
const STATES_BY_CODE = Object.fromEntries(states.map(state => [ `US-${state.code}`, state.name ]));

const MAX_GROUPS = 6;
const MAX_VALUE_CANDIDATES = 8;
const MIN_SAMPLE_SIZE = 10;
const MIN_COVERAGE = 0.8;
const MIN_SILHOUETTE = 0.7;
const MAX_PARTITION_MISMATCHES = 10;
const MAX_PARTITION_MISMATCH_RATE = 0.05;
const MIN_PARTITION_PAIR_MATCH = 0.9;

const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);
const isTimeValue = value => isFiniteNumber(value) && value >= 0;
const isPacketLossValue = value => isFiniteNumber(value) && value >= 0 && value <= 100;
const normalizeString = value => String(value ?? '').trim();
const normalizeNumber = value => isFiniteNumber(value) ? value : null;
const compareStrings = (a, b) => String(a).localeCompare(String(b), 'en');
const compareDisplayValues = (a, b) => {
	if (isFiniteNumber(a.sortValue) && isFiniteNumber(b.sortValue)) {
		return a.sortValue - b.sortValue;
	}

	return compareStrings(a.label, b.label);
};

const getMinimumGroupSize = sampleSize => Math.max(3, Math.min(10, Math.ceil(0.05 * sampleSize)));

const getFailureOutcome = (failureSource) => {
	let labels = {
		target: 'Target error',
		resolver: 'Resolver error',
		internal: 'Internal error',
	};

	return labels[failureSource] || 'Error';
};

const getResultOutcome = (testType, stats) => {
	if (!stats || stats.resultStatus === 'offline') {
		return null;
	}

	if (stats.resultStatus === 'failed') {
		return getFailureOutcome(stats.failureSource);
	}

	if (stats.resultStatus !== 'finished') {
		return null;
	}

	if (testType === 'ping') {
		return isFiniteNumber(stats.avgTiming) ? 'Success' : 'Timed out';
	}

	if ([ 'traceroute', 'mtr' ].includes(testType)) {
		return stats.breakdownValues?.destinationReached ? 'Success' : 'Error';
	}

	if (testType === 'dns') {
		return stats.breakdownValues?.dnsComplete ? 'Success' : 'Error';
	}

	if (testType === 'http') {
		return Number.isInteger(stats.breakdownValues?.httpStatus) ? 'Success' : 'Error';
	}

	return 'Error';
};

const METRICS_BY_TYPE = {
	ping: [
		{ key: 'outcome', label: 'Outcome', kind: 'categorical' },
		{ key: 'packetLoss', label: 'Packet loss (min / avg / max)', kind: 'numeric', units: '%', transform: 'identity', effect: 'loss' },
		{ key: 'averageLatency', label: 'Average latency (min / avg / max)', kind: 'numeric', units: ' ms', transform: 'log1p', effect: 'time' },
	],
	traceroute: [
		{ key: 'outcome', label: 'Outcome', kind: 'categorical' },
		{ key: 'destinationLatency', label: 'Destination latency (min / avg / max)', kind: 'numeric', units: ' ms', transform: 'log1p', effect: 'time' },
	],
	mtr: [
		{ key: 'outcome', label: 'Outcome', kind: 'categorical' },
		{ key: 'destinationLoss', label: 'Destination packet loss (min / avg / max)', kind: 'numeric', units: '%', transform: 'identity', effect: 'loss' },
		{ key: 'destinationLatency', label: 'Destination latency (min / avg / max)', kind: 'numeric', units: ' ms', transform: 'log1p', effect: 'time' },
	],
	dns: [
		{ key: 'outcome', label: 'Outcome', kind: 'categorical' },
		{ key: 'dnsStatus', label: 'DNS status', kind: 'categorical' },
		{ key: 'dnsAnswers', label: 'Answer presence', kind: 'categorical' },
		{ key: 'dnsTotal', label: 'Query time (min / avg / max)', kind: 'numeric', units: ' ms', transform: 'log1p', effect: 'time' },
	],
	http: [
		{ key: 'outcome', label: 'Outcome', kind: 'categorical' },
		{ key: 'httpStatus', label: 'HTTP status', kind: 'categorical', numericCategory: true },
		{ key: 'httpTotal', label: 'Response time (min / avg / max)', kind: 'numeric', units: ' ms', transform: 'log1p', effect: 'time' },
		{ key: 'contentLength', label: 'Content-Length (min / avg / max)', kind: 'numeric', units: ' B', transform: 'log1p', effect: 'contentLength' },
	],
};

const getMetricDefinitions = testType => METRICS_BY_TYPE[testType] || [];

const getMetricValue = (testType, metric, stats) => {
	let outcome = getResultOutcome(testType, stats);

	if (metric.key === 'outcome') {
		return outcome;
	}

	if (outcome !== 'Success') {
		return null;
	}

	let values = stats.breakdownValues || {};

	switch (metric.key) {
		case 'packetLoss': return isPacketLossValue(stats.packetLoss) ? stats.packetLoss : null;
		case 'averageLatency': return isTimeValue(stats.avgTiming) ? stats.avgTiming : null;
		case 'destinationLoss': return isPacketLossValue(values.destinationLoss) ? values.destinationLoss : null;
		case 'destinationLatency': return isTimeValue(values.destinationAvg) ? values.destinationAvg : null;
		case 'dnsStatus': return values.dnsStatus ?? null;
		case 'dnsAnswers': return Number.isInteger(values.dnsAnswers) ? values.dnsAnswers > 0 ? 'Answers' : 'No answers' : null;
		case 'dnsTotal': return isTimeValue(values.dnsTotal) ? values.dnsTotal : null;
		case 'httpStatus': return Number.isInteger(values.httpStatus) ? values.httpStatus : null;
		case 'httpTotal': return isTimeValue(values.httpTotal) ? values.httpTotal : null;
		case 'contentLength': return Number.isSafeInteger(values.contentLength) && values.contentLength >= 0 ? values.contentLength : null;
		default: return null;
	}
};

const canonicalResultDescriptor = (result) => {
	let tags = Array.isArray(result.tags) ? result.tags.map(normalizeString).sort(compareStrings) : [];
	let stats = (result.statsPerTarget || []).map(targetStats => [
		normalizeString(targetStats?.target),
		normalizeString(targetStats?.targetStatus),
		normalizeString(targetStats?.resultStatus),
		normalizeString(targetStats?.failureSource),
		normalizeNumber(targetStats?.minTiming),
		normalizeNumber(targetStats?.avgTiming),
		normalizeNumber(targetStats?.maxTiming),
		normalizeNumber(targetStats?.packetLoss),
		targetStats?.tls?.authorized ?? null,
		targetStats?.breakdownValues?.destinationReached ?? null,
		normalizeNumber(targetStats?.breakdownValues?.destinationAvg),
		normalizeNumber(targetStats?.breakdownValues?.destinationLoss),
		targetStats?.breakdownValues?.dnsComplete ?? null,
		targetStats?.breakdownValues?.dnsStatus ?? null,
		targetStats?.breakdownValues?.dnsAnswers ?? null,
		normalizeNumber(targetStats?.breakdownValues?.dnsTotal),
		targetStats?.breakdownValues?.httpStatus ?? null,
		normalizeNumber(targetStats?.breakdownValues?.httpTotal),
		targetStats?.breakdownValues?.contentLength ?? null,
	]);

	return JSON.stringify([
		normalizeString(result.continent),
		normalizeString(result.region),
		normalizeString(result.country),
		normalizeString(result.state),
		normalizeString(result.city),
		normalizeString(result.network),
		normalizeString(result.asn),
		normalizeNumber(result.latitude),
		normalizeNumber(result.longitude),
		tags,
		stats,
	]);
};

const hashString = (value) => {
	let first = 2166136261;
	let second = 2246822519;

	for (let i = 0; i < value.length; i++) {
		let code = value.charCodeAt(i);

		// eslint-disable-next-line no-bitwise -- Intentional hash mixing.
		first = Math.imul(first ^ code, 16777619);
		// eslint-disable-next-line no-bitwise -- Intentional hash mixing.
		second = Math.imul(second ^ code, 3266489917);
	}

	// eslint-disable-next-line no-bitwise -- Convert hash state to unsigned words.
	return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
};

const getStableProbeEntries = (preparedTestResults) => {
	let entries = (preparedTestResults || []).map(result => ({
		descriptor: canonicalResultDescriptor(result),
		result,
	})).sort((a, b) => compareStrings(a.descriptor, b.descriptor));
	let hashOccurrences = new Map();

	return entries.map((entry) => {
		let hash = hashString(entry.descriptor);
		let occurrence = hashOccurrences.get(hash) || 0;

		hashOccurrences.set(hash, occurrence + 1);

		return {
			...entry,
			key: `${hash}-${occurrence}`,
		};
	});
};

const median = (values) => {
	let middle = Math.floor(values.length / 2);

	return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
};

const compareBoundaries = (a, b) => {
	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		if (a[i] !== b[i]) {
			return a[i] - b[i];
		}
	}

	return a.length - b.length;
};

const buildValueBlocks = (values) => {
	let blocks = [];

	values.forEach((value) => {
		let last = blocks[blocks.length - 1];

		if (last && last.transformed === value.transformed) {
			last.values.push(value);
		} else {
			blocks.push({ transformed: value.transformed, values: [ value ] });
		}
	});

	return blocks;
};

const createSegmentCost = (blocks) => {
	let blockCounts = blocks.map(block => block.values.length);
	let countPrefix = [ 0 ];
	let sumPrefix = [ 0 ];

	blocks.forEach((block, index) => {
		countPrefix.push(countPrefix[index] + blockCounts[index]);
		sumPrefix.push(sumPrefix[index] + block.transformed * blockCounts[index]);
	});

	let costs = new Float64Array(blocks.length * blocks.length);

	for (let start = 0; start < blocks.length; start++) {
		let medianIndex = start;

		for (let end = start; end < blocks.length; end++) {
			let totalCount = countPrefix[end + 1] - countPrefix[start];
			let medianPosition = Math.floor((totalCount - 1) / 2) + 1;

			while (countPrefix[medianIndex + 1] - countPrefix[start] < medianPosition) {
				medianIndex++;
			}

			let medianValue = blocks[medianIndex].transformed;
			let leftCount = countPrefix[medianIndex] - countPrefix[start];
			let leftSum = sumPrefix[medianIndex] - sumPrefix[start];
			let rightCount = countPrefix[end + 1] - countPrefix[medianIndex + 1];
			let rightSum = sumPrefix[end + 1] - sumPrefix[medianIndex + 1];

			costs[start * blocks.length + end] = medianValue * leftCount - leftSum + rightSum - medianValue * rightCount;
		}
	}

	return costs;
};

const getBoundaryPath = (parents, groupCount, end) => {
	let boundaries = Array(Math.max(0, groupCount - 1));

	for (let group = groupCount; group > 1; group--) {
		let start = parents[group][end];

		boundaries[group - 2] = start;
		end = start;
	}

	return boundaries;
};

const solveKMedians = (values, maximumClusters) => {
	let blocks = buildValueBlocks(values);

	if (blocks.length < 2) {
		return [];
	}

	maximumClusters = Math.min(maximumClusters, blocks.length);
	let costs = createSegmentCost(blocks);
	let parents = Array.from({ length: maximumClusters + 1 }, () => new Int32Array(blocks.length + 1).fill(-1));
	let previousCosts = new Float64Array(blocks.length + 1).fill(Infinity);
	let solutions = [];

	previousCosts[0] = 0;

	for (let groupCount = 1; groupCount <= maximumClusters; groupCount++) {
		let currentCosts = new Float64Array(blocks.length + 1).fill(Infinity);

		for (let end = groupCount; end <= blocks.length; end++) {
			let bestCost = Infinity;
			let bestStart = -1;

			for (let start = groupCount - 1; start < end; start++) {
				let candidateCost = previousCosts[start] + costs[start * blocks.length + end - 1];

				if (candidateCost < bestCost) {
					bestCost = candidateCost;
					bestStart = start;
				} else if (candidateCost === bestCost) {
					let candidateBoundaries = groupCount === 1 ? []
						: [ ...getBoundaryPath(parents, groupCount - 1, start), start ];
					let bestBoundaries = groupCount === 1 ? []
						: [ ...getBoundaryPath(parents, groupCount - 1, bestStart), bestStart ];

					if (compareBoundaries(candidateBoundaries, bestBoundaries) < 0) {
						bestStart = start;
					}
				}
			}

			currentCosts[end] = bestCost;
			parents[groupCount][end] = bestStart;
		}

		if (groupCount >= 2) {
			let boundaries = getBoundaryPath(parents, groupCount, blocks.length);
			let boundarySet = new Set(boundaries);
			let clusters = [];
			let current = [];

			blocks.forEach((block, index) => {
				if (boundarySet.has(index)) {
					clusters.push(current);
					current = [];
				}

				current.push(...block.values);
			});

			clusters.push(current);
			solutions.push({ boundaries, clusters });
		}

		previousCosts = currentCosts;
	}

	return solutions;
};

const calculateSilhouette = (clusters) => {
	let values = clusters.flat();
	let valueIndexes = new Map(values.map((value, index) => [ value.entry.key, index ]));
	let prefix = [ 0 ];
	let ranges = [];
	let offset = 0;

	values.forEach((value, index) => prefix.push(prefix[index] + value.transformed));

	clusters.forEach((cluster) => {
		ranges.push({ start: offset, end: offset + cluster.length - 1, length: cluster.length });
		offset += cluster.length;
	});

	let total = 0;
	let count = 0;

	clusters.forEach((cluster, clusterIndex) => {
		cluster.forEach((point) => {
			let index = valueIndexes.get(point.entry.key);
			let range = ranges[clusterIndex];
			let leftDistance = point.transformed * (index - range.start) - (prefix[index] - prefix[range.start]);
			let rightDistance = prefix[range.end + 1] - prefix[index + 1] - point.transformed * (range.end - index);
			let within = (leftDistance + rightDistance) / (cluster.length - 1);
			let nearest = Infinity;

			ranges.forEach((otherRange, otherIndex) => {
				if (otherIndex === clusterIndex) {
					return;
				}

				let otherMean = (prefix[otherRange.end + 1] - prefix[otherRange.start]) / otherRange.length;
				let distance = Math.abs(point.transformed - otherMean);

				nearest = Math.min(nearest, distance);
			});

			let denominator = Math.max(within, nearest);

			total += denominator ? (nearest - within) / denominator : 0;
			count++;
		});
	});

	return count ? total / count : 0;
};

const passesEffectThreshold = (clusters, effect) => {
	let medians = clusters.map(cluster => median(cluster.map(item => item.raw).sort((a, b) => a - b)));

	for (let index = 1; index < medians.length; index++) {
		let previous = medians[index - 1];
		let current = medians[index];
		let difference = current - previous;

		if (effect === 'time' && (difference < 10 || difference < previous * 0.5)) {
			return false;
		}

		if (effect === 'loss' && difference < 10) {
			return false;
		}
	}

	return true;
};

const buildBestNumericPartition = (values, metric, minimumGroupSize) => {
	let sortedValues = values.map(value => ({
		...value,
		transformed: metric.transform === 'log1p' ? Math.log1p(value.raw) : value.raw,
	})).sort((a, b) => a.transformed - b.transformed || compareStrings(a.entry.key, b.entry.key));
	let maximumClusters = Math.min(MAX_GROUPS, buildValueBlocks(sortedValues).length);
	let candidates = solveKMedians(sortedValues, maximumClusters)
		.filter(solution => solution.clusters.every(cluster => cluster.length >= minimumGroupSize))
		.filter(solution => passesEffectThreshold(solution.clusters, metric.effect))
		.map(solution => ({
			...solution,
			silhouette: calculateSilhouette(solution.clusters),
		}));

	return candidates.sort((a, b) => b.silhouette - a.silhouette
		|| a.clusters.length - b.clusters.length
		|| compareBoundaries(a.boundaries, b.boundaries))[0] || null;
};

const getOptimalPartitionAssignment = (valueGroups, metadataGroups) => {
	if (valueGroups.length !== metadataGroups.length) {
		return null;
	}

	let groupCount = valueGroups.length;
	let metadataGroupByProbeKey = new Map();

	metadataGroups.forEach((group, groupIndex) => {
		group.forEach(item => metadataGroupByProbeKey.set(item.entry.key, groupIndex));
	});

	let intersections = valueGroups.map((group) => {
		let counts = Array(groupCount).fill(0);

		group.forEach((item) => {
			let metadataGroupIndex = metadataGroupByProbeKey.get(item.entry.key);

			if (typeof metadataGroupIndex !== 'undefined') {
				counts[metadataGroupIndex]++;
			}
		});

		return counts;
	});
	let states = new Map([ [ 0, { intersectionCount: 0, assignment: [] }] ]);

	for (let valueGroupIndex = 0; valueGroupIndex < groupCount; valueGroupIndex++) {
		let nextStates = new Map();

		for (let [ usedGroups, state ] of states) {
			for (let metadataGroupIndex = 0; metadataGroupIndex < groupCount; metadataGroupIndex++) {
				let groupMarker = 2 ** metadataGroupIndex;

				if (Math.floor(usedGroups / groupMarker) % 2) {
					continue;
				}

				let nextUsedGroups = usedGroups + groupMarker;
				let candidate = {
					intersectionCount: state.intersectionCount + intersections[valueGroupIndex][metadataGroupIndex],
					assignment: [ ...state.assignment, metadataGroupIndex ],
				};
				let current = nextStates.get(nextUsedGroups);

				if (!current
					|| candidate.intersectionCount > current.intersectionCount
					|| (candidate.intersectionCount === current.intersectionCount
						&& compareBoundaries(candidate.assignment, current.assignment) < 0)) {
					nextStates.set(nextUsedGroups, candidate);
				}
			}
		}

		states = nextStates;
	}

	let optimal = states.get(2 ** groupCount - 1);

	return optimal ? { ...optimal, intersections } : null;
};

const partitionsApproximatelyMatch = (valueGroups, metadataGroups) => {
	let optimal = getOptimalPartitionAssignment(valueGroups, metadataGroups);

	if (!optimal) {
		return false;
	}

	let usableCount = valueGroups.reduce((total, group) => total + group.length, 0);
	let allowedMismatches = Math.min(MAX_PARTITION_MISMATCHES, Math.floor(MAX_PARTITION_MISMATCH_RATE * usableCount));

	if (usableCount - optimal.intersectionCount > allowedMismatches) {
		return false;
	}

	return optimal.assignment.every((metadataGroupIndex, valueGroupIndex) => {
		let intersectionCount = optimal.intersections[valueGroupIndex][metadataGroupIndex];
		let precision = intersectionCount / valueGroups[valueGroupIndex].length;
		let recall = intersectionCount / metadataGroups[metadataGroupIndex].length;

		return precision >= MIN_PARTITION_PAIR_MATCH && recall >= MIN_PARTITION_PAIR_MATCH;
	});
};

const getMetadataValue = (result, dimension) => {
	if (dimension === 'continent') {
		let code = normalizeString(result.continent).toUpperCase();

		return code ? { key: code, label: CONTINENTS_BY_CODE[code] || code } : null;
	}

	if (dimension === 'region') {
		let value = normalizeString(result.region);

		return value ? { key: value, label: value } : null;
	}

	if (dimension === 'country') {
		let code = normalizeString(result.country).toUpperCase();

		return code ? { key: code, label: COUNTRIES_BY_CODE[code] || code } : null;
	}

	if (dimension === 'state') {
		let rawState = normalizeString(result.state);
		let code = rawState ? /^US-/i.test(rawState) ? rawState.toUpperCase() : `US-${rawState.toUpperCase()}` : '';

		return code ? { key: code, label: STATES_BY_CODE[code] || rawState } : null;
	}

	if (dimension === 'network') {
		let value = normalizeString(result.network);

		return value ? { key: value, label: value } : null;
	}

	if (dimension === 'asn') {
		let value = normalizeString(result.asn).replace(/^AS/i, '');

		return value ? { key: value, label: `AS${value}`, sortValue: Number(value) } : null;
	}

	return null;
};

const DIMENSIONS = [
	{ key: 'continent', title: 'Location breakdown', otherLabel: 'Other locations' },
	{ key: 'region', title: 'Location breakdown', otherLabel: 'Other locations' },
	{ key: 'country', title: 'Location breakdown', otherLabel: 'Other locations' },
	{ key: 'state', title: 'Location breakdown', otherLabel: 'Other locations', usOnly: true },
	{ key: 'network', title: 'Network breakdown', otherLabel: 'Other networks' },
	{ key: 'asn', title: 'ASN breakdown', otherLabel: 'Other ASNs' },
];

const buildAtomicMetadataGroups = (entries, usableKeys, dimension) => {
	if (dimension.usOnly && !entries.every(entry => normalizeString(entry.result.country).toUpperCase() === 'US')) {
		return null;
	}

	let groupsByValue = new Map();

	for (let entry of entries) {
		let value = getMetadataValue(entry.result, dimension.key);

		if (!value) {
			if (usableKeys.has(entry.key)) {
				return null;
			}

			continue;
		}

		let group = groupsByValue.get(value.key);

		if (!group) {
			group = { ...value, entries: [] };
			groupsByValue.set(value.key, group);
		}

		group.entries.push(entry);
	}

	let groups = [ ...groupsByValue.values() ].sort((a, b) => b.entries.length - a.entries.length || compareDisplayValues(a, b));

	return groups;
};

const toValueGroups = clusters => clusters.map(cluster => cluster.map(item => item));

const matchMetadata = ({ valueGroups, usableEntries, nonOfflineEntries, minimumGroupSize }) => {
	let usableKeys = new Set(usableEntries.map(item => item.entry.key));

	for (let dimension of DIMENSIONS) {
		let atomicGroups = buildAtomicMetadataGroups(nonOfflineEntries, usableKeys, dimension);

		if (!atomicGroups || atomicGroups.length < 2) {
			continue;
		}

		let fullPartitionHasCoverage = atomicGroups.every((group) => {
			let usableCount = group.entries.filter(entry => usableKeys.has(entry.key)).length;

			return group.entries.length >= minimumGroupSize && usableCount / group.entries.length >= MIN_COVERAGE;
		});

		if (atomicGroups.length <= MAX_GROUPS && fullPartitionHasCoverage) {
			let metadataValueGroups = atomicGroups.map(group => group.entries
				.filter(entry => usableKeys.has(entry.key))
				.map(entry => ({ entry })));

			if (partitionsApproximatelyMatch(valueGroups, metadataValueGroups)) {
				let groups = atomicGroups.map(group => ({
					label: group.label,
					probeCount: group.entries.length,
					probeKeys: group.entries.map(entry => entry.key).sort(compareStrings),
				})).sort((a, b) => b.probeCount - a.probeCount || compareStrings(a.label, b.label));

				return {
					dimension: dimension.key,
					title: dimension.title,
					shape: 'full',
					comparisonLabel: dimension.key === 'network' && groups.length === 2
						? `${groups[0].label} versus ${groups[1].label}`
						: null,
					groups,
				};
			}
		}

		for (let namedGroup of atomicGroups) {
			let otherEntries = atomicGroups.filter(group => group !== namedGroup).flatMap(group => group.entries);
			let namedUsableCount = namedGroup.entries.filter(entry => usableKeys.has(entry.key)).length;
			let otherUsableCount = otherEntries.filter(entry => usableKeys.has(entry.key)).length;

			if (namedGroup.entries.length < minimumGroupSize
				|| otherEntries.length < minimumGroupSize
				|| namedUsableCount / namedGroup.entries.length < MIN_COVERAGE
				|| otherUsableCount / otherEntries.length < MIN_COVERAGE) {
				continue;
			}

			let metadataValueGroups = [ namedGroup.entries, otherEntries ].map(group => group
				.filter(entry => usableKeys.has(entry.key))
				.map(entry => ({ entry })));

			if (!partitionsApproximatelyMatch(valueGroups, metadataValueGroups)) {
				continue;
			}

			let groups = [
				{
					label: namedGroup.label,
					probeCount: namedGroup.entries.length,
					probeKeys: namedGroup.entries.map(entry => entry.key).sort(compareStrings),
				},
				{
					label: dimension.otherLabel,
					probeCount: otherEntries.length,
					probeKeys: otherEntries.map(entry => entry.key).sort(compareStrings),
				},
			];

			return {
				dimension: dimension.key,
				title: dimension.title,
				shape: 'one-rest',
				comparisonLabel: null,
				groups,
			};
		}
	}

	return null;
};

const buildCategoricalCandidates = (values, minimumGroupSize) => {
	let categories = new Map();

	values.forEach((value) => {
		let categoryKey = `${typeof value.raw}:${String(value.raw)}`;
		let category = categories.get(categoryKey);

		if (!category) {
			category = {
				label: String(value.raw),
				sortValue: typeof value.raw === 'number' ? value.raw : null,
				values: [],
			};

			categories.set(categoryKey, category);
		}

		category.values.push(value);
	});

	let sortedCategories = [ ...categories.values() ].sort((a, b) => b.values.length - a.values.length || compareDisplayValues(a, b));
	let candidates = [];

	if (sortedCategories.length >= 2 && sortedCategories.length <= MAX_GROUPS) {
		candidates.push({
			groups: sortedCategories.map(category => category.values),
			passesSize: sortedCategories.every(category => category.values.length >= minimumGroupSize),
		});
	}

	if (sortedCategories.length >= 2) {
		sortedCategories.forEach((category) => {
			let other = sortedCategories.filter(item => item !== category).flatMap(item => item.values);

			candidates.push({
				groups: [ category.values, other ],
				passesSize: category.values.length >= minimumGroupSize && other.length >= minimumGroupSize,
			});
		});
	}

	return candidates;
};

const inferMeasurementBreakdown = ({ locations, preparedTestResults, targets, testType }) => {
	locations = Array.isArray(locations) ? locations : [];
	preparedTestResults = Array.isArray(preparedTestResults) ? preparedTestResults : [];
	targets = Array.isArray(targets) ? targets : [];
	testType = normalizeString(testType).toLowerCase();

	if (locations.length !== 1 || preparedTestResults.length < MIN_SAMPLE_SIZE || !METRICS_BY_TYPE[testType]) {
		return null;
	}

	let entries = getStableProbeEntries(preparedTestResults);
	let observedTargetCount = Math.max(0, ...entries.map(entry => entry.result.statsPerTarget?.length || 0));
	let targetCount = Math.max(targets.length, observedTargetCount);

	if (!targetCount || entries.some(entry => entry.result.statsPerTarget?.length !== targetCount
		|| entry.result.statsPerTarget.some(stats => !stats?.targetStatus || stats.targetStatus === 'in-progress'
			|| !stats.resultStatus || stats.resultStatus === 'in-progress'))) {
		return null;
	}

	let minimumGroupSize = getMinimumGroupSize(entries.length);
	let candidateCount = 0;

	for (let targetIndex = 0; targetIndex < targetCount; targetIndex++) {
		let nonOfflineEntries = entries.filter(entry => entry.result.statsPerTarget[targetIndex].resultStatus !== 'offline');
		let offlineCount = entries.length - nonOfflineEntries.length;

		for (let metric of METRICS_BY_TYPE[testType]) {
			let usableEntries = nonOfflineEntries.map((entry) => {
				let raw = getMetricValue(testType, metric, entry.result.statsPerTarget[targetIndex]);

				return raw === null || typeof raw === 'undefined' || (metric.kind === 'numeric' && !isFiniteNumber(raw))
					? null
					: { entry, raw };
			}).filter(Boolean);

			if (usableEntries.length / entries.length < MIN_COVERAGE) {
				continue;
			}

			let valueCandidates;

			if (metric.kind === 'categorical') {
				valueCandidates = buildCategoricalCandidates(usableEntries, minimumGroupSize);
			} else {
				let numericCandidate = buildBestNumericPartition(usableEntries, metric, minimumGroupSize);

				valueCandidates = numericCandidate ? [{
					groups: toValueGroups(numericCandidate.clusters),
					passesSize: true,
					passesQuality: numericCandidate.silhouette >= MIN_SILHOUETTE,
				}] : [];
			}

			for (let valueCandidate of valueCandidates) {
				if (candidateCount >= MAX_VALUE_CANDIDATES) {
					return null;
				}

				candidateCount++;

				if (!valueCandidate.passesSize || valueCandidate.passesQuality === false) {
					continue;
				}

				let match = matchMetadata({
					valueGroups: valueCandidate.groups,
					usableEntries,
					nonOfflineEntries,
					minimumGroupSize,
				});

				if (match) {
					return {
						...match,
						supportingTargetIndex: targetIndex,
						supportingTarget: targets[targetIndex] || entries[0].result.statsPerTarget[targetIndex].target || `Target ${targetIndex + 1}`,
						supportingMetric: { key: metric.key, label: metric.label },
						offlineCount,
						sampleSize: entries.length,
					};
				}
			}
		}
	}

	return null;
};

module.exports = {
	getMetricDefinitions,
	getMetricValue,
	getMinimumGroupSize,
	getResultOutcome,
	getStableProbeEntries,
	inferMeasurementBreakdown,
};
