const { formatAsn, getContinentName, getCountryName, getStateName } = require('./measurement-locations');

const MAX_GROUPS = 6;
const MAX_CANDIDATES = 8;
const MIN_COVERAGE = 0.8;
const MIN_SILHOUETTE = 0.7;
const MAX_PARTITION_MISMATCHES = 10;
const MAX_PARTITION_MISMATCH_RATE = 0.05;
const MIN_PARTITION_PAIR_MATCH = 0.9;

const compareStrings = (a, b) => a.localeCompare(b, 'en');
const compareDisplayValues = (a, b) => typeof a.sortValue === 'number' ? a.sortValue - b.sortValue : compareStrings(a.label, b.label);
const compareGroups = (a, b) => b.results.length - a.results.length || compareDisplayValues(a, b);

const getMinimumGroupSize = sampleSize => Math.max(3, Math.min(10, Math.ceil(0.05 * sampleSize)));

const buildSampleBlocks = (samples) => {
	let blocks = [];

	samples.forEach((sample) => {
		let lastBlock = blocks[blocks.length - 1];

		if (lastBlock && lastBlock.transformed === sample.transformed) {
			lastBlock.samples.push(sample);
		} else {
			blocks.push({ transformed: sample.transformed, samples: [ sample ] });
		}
	});

	return blocks;
};

// Cost of each block range: the sum of absolute deviations from its lower median.
const getSegmentCosts = (blocks) => {
	let countPrefix = [ 0 ];
	let sumPrefix = [ 0 ];

	blocks.forEach((block, index) => {
		countPrefix.push(countPrefix[index] + block.samples.length);
		sumPrefix.push(sumPrefix[index] + block.transformed * block.samples.length);
	});

	let costs = new Float64Array(blocks.length * blocks.length);

	for (let start = 0; start < blocks.length; start++) {
		let medianIndex = start;

		for (let last = start; last < blocks.length; last++) {
			let medianPosition = Math.ceil((countPrefix[last + 1] - countPrefix[start]) / 2);

			while (countPrefix[medianIndex + 1] - countPrefix[start] < medianPosition) {
				medianIndex++;
			}

			let medianValue = blocks[medianIndex].transformed;
			let leftCount = countPrefix[medianIndex] - countPrefix[start];
			let leftSum = sumPrefix[medianIndex] - sumPrefix[start];
			let rightCount = countPrefix[last + 1] - countPrefix[medianIndex + 1];
			let rightSum = sumPrefix[last + 1] - sumPrefix[medianIndex + 1];

			costs[start * blocks.length + last] = medianValue * leftCount - leftSum + rightSum - medianValue * rightCount;
		}
	}

	return costs;
};

const getBoundaryPath = (lastClusterStarts, groupCount, end) => {
	let boundaries = Array(groupCount - 1);

	for (let group = groupCount; group > 1; group--) {
		let start = lastClusterStarts[group][end];

		boundaries[group - 2] = start;
		end = start;
	}

	return boundaries;
};

const toClusters = (blocks, boundaries) => [ 0, ...boundaries ].map((start, index) => blocks
	.slice(start, boundaries[index] ?? blocks.length)
	.flatMap(block => block.samples));

// Exact k-medians over equal-value blocks for each cluster count; on ties the scan keeps the earliest boundaries.
const solveKMedians = (samples, maximumClusters) => {
	let blocks = buildSampleBlocks(samples);

	if (blocks.length < 2) {
		return [];
	}

	let clusterLimit = Math.min(maximumClusters, blocks.length);
	let costs = getSegmentCosts(blocks);
	let lastClusterStarts = Array.from({ length: clusterLimit + 1 }, () => new Int32Array(blocks.length + 1).fill(-1));
	let previousCosts = new Float64Array(blocks.length + 1).fill(Infinity);
	let solutions = [];

	previousCosts[0] = 0;

	for (let groupCount = 1; groupCount <= clusterLimit; groupCount++) {
		let currentCosts = new Float64Array(blocks.length + 1).fill(Infinity);

		for (let end = groupCount; end <= blocks.length; end++) {
			let bestCost = Infinity;
			let bestStart = -1;

			for (let start = groupCount - 1; start < end; start++) {
				let cost = previousCosts[start] + costs[start * blocks.length + end - 1];

				if (cost < bestCost) {
					bestCost = cost;
					bestStart = start;
				}
			}

			currentCosts[end] = bestCost;
			lastClusterStarts[groupCount][end] = bestStart;
		}

		if (groupCount >= 2) {
			solutions.push(toClusters(blocks, getBoundaryPath(lastClusterStarts, groupCount, blocks.length)));
		}

		previousCosts = currentCosts;
	}

	return solutions;
};

// Simplified silhouette: the separation is the distance to the nearest other cluster's mean.
const calculateSilhouette = (clusters) => {
	let samples = clusters.flat();
	let prefix = [ 0 ];
	let offset = 0;

	samples.forEach((sample, index) => prefix.push(prefix[index] + sample.transformed));

	let ranges = clusters.map((cluster) => {
		let range = { start: offset, last: offset + cluster.length - 1 };

		offset += cluster.length;

		return range;
	});

	let means = ranges.map(({ start, last }, index) => (prefix[last + 1] - prefix[start]) / clusters[index].length);
	let total = 0;

	clusters.forEach((cluster, clusterIndex) => {
		let { start, last } = ranges[clusterIndex];
		let otherMeans = means.filter((_mean, index) => index !== clusterIndex);

		cluster.forEach((point, pointIndex) => {
			let index = start + pointIndex;
			let leftDistance = point.transformed * (index - start) - (prefix[index] - prefix[start]);
			let rightDistance = prefix[last + 1] - prefix[index + 1] - point.transformed * (last - index);
			let within = (leftDistance + rightDistance) / (cluster.length - 1);
			let nearest = otherMeans.reduce((min, mean) => Math.min(min, Math.abs(point.transformed - mean)), Infinity);
			let denominator = Math.max(within, nearest);

			total += denominator ? (nearest - within) / denominator : 0;
		});
	});

	return total / samples.length;
};

const medianOfSortedValues = (values) => {
	let middle = Math.floor(values.length / 2);

	return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
};

const hasDistinctMedians = (clusters, metric) => {
	// log1p can map distinct raw values to one transformed value, so the raw values need their own sort.
	let medians = clusters.map(cluster => medianOfSortedValues(cluster.map(sample => sample.raw).sort((a, b) => a - b)));

	return medians.slice(1).every((median, index) => !metric.isNegligibleDifference(medians[index], median));
};

const buildNumericCandidates = (samples, metric, minimumGroupSize) => {
	let sortedSamples = samples
		.map(sample => ({ ...sample, transformed: metric.transform ? metric.transform(sample.raw) : sample.raw }))
		.sort((a, b) => a.transformed - b.transformed);

	let best = solveKMedians(sortedSamples, MAX_GROUPS)
		.filter(clusters => clusters.every(cluster => cluster.length >= minimumGroupSize))
		.filter(clusters => hasDistinctMedians(clusters, metric))
		.map(clusters => ({ clusters, silhouette: calculateSilhouette(clusters) }))
		.sort((a, b) => b.silhouette - a.silhouette || a.clusters.length - b.clusters.length)[0];

	return best ? [{ sampleGroups: best.clusters, isQualified: best.silhouette >= MIN_SILHOUETTE }] : [];
};

const buildCategoricalCandidates = (samples, minimumGroupSize) => {
	let categories = new Map();

	samples.forEach((sample) => {
		let category = categories.get(sample.raw);

		if (!category) {
			category = { label: String(sample.raw), sortValue: sample.raw, samples: [] };
			categories.set(sample.raw, category);
		}

		category.samples.push(sample);
	});

	let sortedCategories = [ ...categories.values() ].sort((a, b) => b.samples.length - a.samples.length || compareDisplayValues(a, b));

	if (sortedCategories.length < 2) {
		return [];
	}

	let toCandidate = sampleGroups => ({ sampleGroups, isQualified: sampleGroups.every(group => group.length >= minimumGroupSize) });
	let partitionCandidate = toCandidate(sortedCategories.map(category => category.samples));

	// With two categories, each one-vs-rest split is the same partition.
	if (sortedCategories.length === 2) {
		return [ partitionCandidate ];
	}

	let complementCandidates = sortedCategories.map(category => toCandidate([
		category.samples,
		sortedCategories.filter(other => other !== category).flatMap(other => other.samples),
	]));

	return sortedCategories.length <= MAX_GROUPS
		? [ partitionCandidate, ...complementCandidates ]
		: complementCandidates;
};

const buildCandidates = (samples, metric, minimumGroupSize) => metric.kind === 'categorical'
	? buildCategoricalCandidates(samples, minimumGroupSize)
	: buildNumericCandidates(samples, metric, minimumGroupSize);

const countIntersections = (sampleGroups, metadataGroups) => {
	let metadataGroupIndexByResult = new Map();

	metadataGroups.forEach((group, index) => group.usableResults.forEach(result => metadataGroupIndexByResult.set(result, index)));

	return sampleGroups.map((group) => {
		let counts = Array(metadataGroups.length).fill(0);

		group.forEach(sample => counts[metadataGroupIndexByResult.get(sample.result)]++);

		return counts;
	});
};

// Visits the assignments in lexicographic order and keeps the first one with the highest intersection count.
const findBestAssignment = (intersections) => {
	let best = null;
	let visit = (assignment, count) => {
		if (assignment.length === intersections.length) {
			if (!best || count > best.count) {
				best = { assignment, count };
			}

			return;
		}

		intersections[assignment.length].forEach((intersection, metadataGroupIndex) => {
			if (!assignment.includes(metadataGroupIndex)) {
				visit([ ...assignment, metadataGroupIndex ], count + intersection);
			}
		});
	};

	visit([], 0);

	return best;
};

const partitionsApproximatelyMatch = (sampleGroups, metadataGroups) => {
	if (sampleGroups.length !== metadataGroups.length) {
		return false;
	}

	let intersections = countIntersections(sampleGroups, metadataGroups);
	let best = findBestAssignment(intersections);
	let usableCount = sampleGroups.reduce((total, group) => total + group.length, 0);
	let allowedMismatches = Math.min(MAX_PARTITION_MISMATCHES, Math.floor(MAX_PARTITION_MISMATCH_RATE * usableCount));

	if (usableCount - best.count > allowedMismatches) {
		return false;
	}

	return best.assignment.every((metadataGroupIndex, sampleGroupIndex) => {
		let intersectionCount = intersections[sampleGroupIndex][metadataGroupIndex];
		let precision = intersectionCount / sampleGroups[sampleGroupIndex].length;
		let recall = intersectionCount / metadataGroups[metadataGroupIndex].usableResults.length;

		return precision >= MIN_PARTITION_PAIR_MATCH && recall >= MIN_PARTITION_PAIR_MATCH;
	});
};

const toCodeValue = (code, getName) => code ? { key: code, label: getName(code) || code } : null;
const toTextValue = value => value ? { key: value, label: value } : null;

const LOCATION_DIMENSION = { title: 'Location breakdown', otherLabel: 'Other locations' };

const DIMENSIONS = [
	{ ...LOCATION_DIMENSION, getValue: result => toCodeValue(result.continent, getContinentName) },
	{ ...LOCATION_DIMENSION, getValue: result => toTextValue(result.region) },
	{ ...LOCATION_DIMENSION, getValue: result => toCodeValue(result.country, getCountryName) },
	{ ...LOCATION_DIMENSION, usOnly: true, getValue: result => toCodeValue(result.state, getStateName) },
	{
		title: 'Network breakdown',
		otherLabel: 'Other networks',
		getValue: result => toTextValue(result.network),
	},
	{
		title: 'ASN breakdown',
		otherLabel: 'Other ASNs',
		getValue: result => ({ key: result.asn, label: formatAsn(result.asn), sortValue: result.asn }),
	},
];

const buildMetadataGroups = (results, usableResults, dimension) => {
	if (dimension.usOnly && !results.every(result => result.country === 'US')) {
		return null;
	}

	let groupsByKey = new Map();

	for (let result of results) {
		let value = dimension.getValue(result);
		let isUsable = usableResults.has(result);

		if (!value) {
			if (isUsable) {
				return null;
			}

			continue;
		}

		let group = groupsByKey.get(value.key);

		if (!group) {
			group = { ...value, results: [], usableResults: [] };
			groupsByKey.set(value.key, group);
		}

		group.results.push(result);

		if (isUsable) {
			group.usableResults.push(result);
		}
	}

	return [ ...groupsByKey.values() ].sort(compareGroups);
};

const hasCoverage = ({ results, usableResults }, minimumGroupSize) => results.length >= minimumGroupSize
	&& usableResults.length / results.length >= MIN_COVERAGE;

const matchFullPartition = ({ sampleGroups, metadataGroups, minimumGroupSize }) => {
	if (!metadataGroups.every(group => hasCoverage(group, minimumGroupSize)) || !partitionsApproximatelyMatch(sampleGroups, metadataGroups)) {
		return null;
	}

	return { groups: metadataGroups.map(({ label, results }) => ({ label, results })) };
};

const matchNamedGroup = ({ sampleGroups, results, metadataGroups, dimension, minimumGroupSize }) => {
	// A named group and its complement can only match a two-group value partition.
	if (sampleGroups.length !== 2) {
		return null;
	}

	for (let namedGroup of metadataGroups.filter(group => hasCoverage(group, minimumGroupSize))) {
		let otherGroups = metadataGroups.filter(group => group !== namedGroup);
		let otherResults = new Set(otherGroups.flatMap(group => group.results));
		let otherGroup = {
			label: dimension.otherLabel,
			// In result order, so its sums match the same probes' column in explicit mode.
			results: results.filter(result => otherResults.has(result)),
			usableResults: otherGroups.flatMap(group => group.usableResults),
		};

		if (hasCoverage(otherGroup, minimumGroupSize) && partitionsApproximatelyMatch(sampleGroups, [ namedGroup, otherGroup ])) {
			return { groups: [ namedGroup, otherGroup ].map(({ label, results }) => ({ label, results })) };
		}
	}

	return null;
};

const matchMetadata = ({ sampleGroups, results, usableResults, minimumGroupSize }) => {
	for (let dimension of DIMENSIONS) {
		let metadataGroups = buildMetadataGroups(results, usableResults, dimension);

		if (!metadataGroups || metadataGroups.length < 2) {
			continue;
		}

		let options = { sampleGroups, results, metadataGroups, dimension, minimumGroupSize };
		let match = matchFullPartition(options) || matchNamedGroup(options);

		if (match) {
			return { title: dimension.title, ...match };
		}
	}

	return null;
};

const getMetricSamples = (results, metric, targetIndex) => results
	.map(result => ({ result, raw: metric.getValue(result.statsPerTarget[targetIndex]) }))
	.filter(sample => sample.raw !== null);

const inferMeasurementBreakdown = ({ results, metrics, targetCount }) => {
	let minimumGroupSize = getMinimumGroupSize(results.length);
	let candidateCount = 0;

	for (let targetIndex = 0; targetIndex < targetCount; targetIndex++) {
		for (let metric of metrics) {
			let samples = getMetricSamples(results, metric, targetIndex);

			if (samples.length / results.length < MIN_COVERAGE) {
				continue;
			}

			let usableResults = new Set(samples.map(sample => sample.result));

			for (let candidate of buildCandidates(samples, metric, minimumGroupSize)) {
				// The budget spans all targets and metrics, unqualified candidates included.
				if (candidateCount >= MAX_CANDIDATES) {
					return null;
				}

				candidateCount++;

				if (!candidate.isQualified) {
					continue;
				}

				let match = matchMetadata({
					sampleGroups: candidate.sampleGroups,
					results,
					usableResults,
					minimumGroupSize,
				});

				if (match) {
					return { ...match, notable: { targetIndex, metricKey: metric.key } };
				}
			}
		}
	}

	return null;
};

module.exports = { compareDisplayValues, compareGroups, inferMeasurementBreakdown };
