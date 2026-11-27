const _ = require('../_');
const { getHttpSizeLabel } = require('./http-size');
const { getLocationLabel, isWorldLocation, matchProbesToLocations } = require('./measurement-locations');
const { compareDisplayValues, compareGroups, inferMeasurementBreakdown } = require('./measurement-breakdown-inference');

const EMPTY_VALUE = '\u2014';
const MIN_ONLINE_PROBES = 10;
const SCALE_STEPS = [ 1, 2, 2.5, 5, 10 ];

const isDnsError = status => status !== 'NOERROR';
const isHttpError = status => status >= 400;

const isNegligibleTimeDifference = (previous, current) => current - previous < 10 || current - previous < previous * 0.5;
const isNegligiblePercentageDifference = (previous, current) => current - previous < 10;

const createTimingMetric = (label, format) => ({
	label,
	kind: 'numeric',
	units: 'ms',
	transform: Math.log1p,
	isNegligibleDifference: isNegligibleTimeDifference,
	format,
	getValue: stats => Number.isFinite(stats.avgTiming) ? stats.avgTiming : null,
});

const LATENCY = {
	...createTimingMetric('Latency', _.formatTimingValue),
	getMin: stats => stats.minTiming,
	getMax: stats => stats.maxTiming,
};

// DNS and HTTP totals are whole milliseconds, which the results table shows unformatted.
const RESPONSE_TIME = createTimingMetric('Response time', Math.round);
const QUERY_TIME = createTimingMetric('Query time', Math.round);

const PACKET_LOSS = {
	label: 'Packet loss',
	kind: 'numeric',
	units: '%',
	isNegligibleDifference: isNegligiblePercentageDifference,
	format: value => Math.round(value * 10) / 10,
	getValue: stats => stats.packetLoss,
};

const DNS_STATUS = {
	label: 'DNS status',
	kind: 'categorical',
	isProblem: isDnsError,
	getValue: stats => stats.dnsStatus,
};

const HTTP_STATUS = {
	label: 'HTTP status',
	kind: 'categorical',
	isProblem: isHttpError,
	getValue: stats => stats.httpStatus,
};

// The label follows the measurement's size mode, see getMetrics().
const HTTP_SIZE = {
	kind: 'categorical',
	maxItems: 3,
	itemName: 'size',
	isProblem: () => false,
	getValue: stats => stats.httpSizeText,
	getSortValue: stats => stats.httpSize,
};

const TLS_ERRORS = {
	label: 'TLS errors',
	kind: 'count',
	optional: true,
	isProblem: count => count > 0,
	matches: stats => stats.tls?.authorized === false,
};

const ZERO_ANSWERS = {
	label: 'Responses without answers',
	kind: 'count',
	optional: true,
	isProblem: count => count > 0,
	matches: stats => stats.dnsAnswerCount === 0,
};

const getFailure = (stats) => {
	if (stats.isFailed) {
		return _.getGpFailureStatusText(stats.failureSource);
	}

	return stats.avgTiming === _.getProbeTimeOutValue() ? 'Timeout' : null;
};

const FAILURES = {
	label: 'Failures',
	kind: 'failures',
	optional: true,
	isProblem: () => true,
	getValue: getFailure,
};

const METRICS_BY_TYPE = {
	ping: [ LATENCY, PACKET_LOSS, FAILURES ],
	traceroute: [ LATENCY, FAILURES ],
	mtr: [ LATENCY, PACKET_LOSS, FAILURES ],
	dns: [ DNS_STATUS, ZERO_ANSWERS, QUERY_TIME, FAILURES ],
	http: [ HTTP_STATUS, HTTP_SIZE, TLS_ERRORS, RESPONSE_TIME, FAILURES ],
};

// The inference splits on single per-probe values.
const FAILURE_SPLIT = { kind: 'categorical', getValue: stats => getFailure(stats) ?? 'None' };

const ZERO_ANSWERS_SPLIT = {
	kind: 'categorical',
	getValue: stats => stats.dnsAnswerCount === null ? null : ZERO_ANSWERS.matches(stats),
};

const HTTP_SIZE_SPLIT = { kind: 'categorical', getValue: stats => stats.httpSize };

const SPLIT_METRICS_BY_TYPE = {
	ping: [ FAILURE_SPLIT, PACKET_LOSS, LATENCY ],
	traceroute: [ FAILURE_SPLIT, LATENCY ],
	mtr: [ FAILURE_SPLIT, PACKET_LOSS, LATENCY ],
	dns: [ FAILURE_SPLIT, DNS_STATUS, ZERO_ANSWERS_SPLIT, QUERY_TIME ],
	http: [ FAILURE_SPLIT, HTTP_STATUS, HTTP_SIZE_SPLIT, RESPONSE_TIME ],
};

const getMetrics = (testType, httpSizeMode) => METRICS_BY_TYPE[testType]
	.map(metric => metric === HTTP_SIZE ? { ...metric, label: getHttpSizeLabel(httpSizeMode) } : metric);

const summarizeNumbers = (metric, statsList) => {
	let measured = statsList.filter(stats => metric.getValue(stats) !== null);

	if (!measured.length) {
		return null;
	}

	let values = [
		Math.min(...measured.map(metric.getMin || metric.getValue)),
		measured.reduce((sum, stats) => sum + metric.getValue(stats), 0) / measured.length,
		Math.max(...measured.map(metric.getMax || metric.getValue)),
	];

	let texts = values.map(metric.format);
	let isMuted = values.every(value => value === 0);

	let statistics = texts.every(text => text === texts[0])
		? [{ text: texts[0], className: isMuted ? '' : 'is-avg' }]
		: texts.map((text, index) => ({ text, className: index === 1 ? 'is-avg' : 'is-bound' }));

	return { values, statistics, isMuted };
};

const limitItems = (items, metric) => {
	if (!metric.maxItems || items.length <= metric.maxItems) {
		return items;
	}

	let others = items.slice(metric.maxItems);

	return [ ...items.slice(0, metric.maxItems), {
		label: `+${others.length} other ${_.pluralize(metric.itemName, others.length)}`,
		count: others.reduce((sum, item) => sum + item.count, 0),
		isProblem: false,
	}];
};

const summarizeCategories = (metric, statsList) => {
	let items = new Map();

	for (let stats of statsList) {
		let value = metric.getValue(stats);

		if (value === null) {
			continue;
		}

		if (!items.has(value)) {
			items.set(value, {
				label: String(value),
				sortValue: metric.getSortValue ? metric.getSortValue(stats) : value,
				count: 0,
				isProblem: metric.isProblem(value),
			});
		}

		items.get(value).count++;
	}

	if (!items.size) {
		return null;
	}

	return { items: limitItems([ ...items.values() ].sort((a, b) => b.count - a.count || compareDisplayValues(a, b)), metric) };
};

const summarizeCount = (metric, statsList) => {
	let value = statsList.filter(metric.matches).length;

	return { value, isProblem: metric.isProblem(value), isMuted: value === 0 };
};

const summarizeFailures = (metric, statsList) => summarizeCategories(metric, statsList) || { value: 'None', isMuted: true };

const SUMMARIZERS_BY_KIND = {
	numeric: summarizeNumbers,
	categorical: summarizeCategories,
	count: summarizeCount,
	failures: summarizeFailures,
};

const summarizeGroup = (metric, group, targetIndex) => SUMMARIZERS_BY_KIND[metric.kind](metric, group.results.map(result => result.statsPerTarget[targetIndex]));

const hasOccurrences = summary => Boolean(summary.items) || (typeof summary.value === 'number' && summary.value > 0);

// Bars span the row's largest value, and their colours follow the map's scale, so each value has its marker's colour.
const getRangeScale = (metric, summaries, probesMaxTiming) => {
	if (metric.kind !== 'numeric' || !summaries.some(summary => summary.values[2] > 0)) {
		return null;
	}

	let colorScale = metric.units === 'ms' ? probesMaxTiming : 100;
	let largest = Math.max(colorScale, ...summaries.map(summary => summary.values[2]));
	let magnitude = 10 ** Math.floor(Math.log10(largest));
	let max = SCALE_STEPS.map(step => step * magnitude).find(value => value >= largest);

	return { max, colorScale, label: `${max} ${metric.units}` };
};

const getRangeMarkers = (statistics, units) => {
	let toMarker = (name, statistic) => ({ name, title: `${statistic.text} ${units}` });

	return statistics.length > 1
		? [ toMarker('min', statistics[0]), toMarker('max', statistics[2]), toMarker('avg', statistics[1]) ]
		: [ toMarker('avg', statistics[0]) ];
};

const getRange = (cell, scale, units) => {
	if (scale === null || !cell.values) {
		return null;
	}

	let [ min, avg, max ] = cell.values.map(value => value / scale.max * 100);

	return { min, avg, max, red: scale.colorScale / scale.max * 100, markers: getRangeMarkers(cell.statistics, units) };
};

const toMetricRow = (metric, summaries, rangeScale) => {
	let cells = summaries.map(summary => summary || { value: EMPTY_VALUE, isMuted: true });

	return {
		label: metric.label,
		units: metric.units,
		scaleLabel: rangeScale?.label,
		showsOrder: cells.some(cell => cell.statistics?.length > 1),
		cells: cells.map(cell => ({ ...cell, range: getRange(cell, rangeScale, metric.units) })),
	};
};

const summarizeMetric = (metric, { groups, probesMaxTiming, targetIndexes }) => {
	let summariesByTarget = targetIndexes.map(targetIndex => groups.map(group => summarizeGroup(metric, group, targetIndex)));
	let summaries = summariesByTarget.flat().filter(Boolean);

	return {
		metric,
		summariesByTarget,
		isShown: !metric.optional || summaries.some(hasOccurrences),
		rangeScale: getRangeScale(metric, summaries, probesMaxTiming),
	};
};

const getExplicitBreakdown = ({ locations, results }) => {
	let requestedLocations = locations.filter(location => !isWorldLocation(location));
	let probesByLocation = matchProbesToLocations(results, requestedLocations);
	let groups = requestedLocations
		.map((location, index) => ({ results: probesByLocation[index], label: getLocationLabel(location) }))
		.filter(group => group.results.length)
		.sort(compareGroups);

	return groups.length < 2 ? null : { title: 'Location breakdown', groups };
};

const buildTargets = (groups, { httpSizeMode, probesMaxTiming, targetNames, testType }) => {
	let targetIndexes = targetNames.map((_name, index) => index);
	let shownMetrics = getMetrics(testType, httpSizeMode)
		.map(metric => summarizeMetric(metric, { groups, probesMaxTiming, targetIndexes }))
		.filter(({ isShown }) => isShown);

	return targetNames.map((name, targetIndex) => ({
		name,
		metricRows: shownMetrics
			.filter(({ summariesByTarget }) => summariesByTarget[targetIndex].some(Boolean))
			.map(({ metric, summariesByTarget, rangeScale }) => toMetricRow(metric, summariesByTarget[targetIndex], rangeScale)),
	}));
};

const buildMeasurementBreakdown = ({ httpSizeMode, locations = [], preparedTestResults, probesMaxTiming, testType }) => {
	let targetStats = preparedTestResults[0].statsPerTarget;

	// Table sorting reorders preparedTestResults; restore API order so sorting can't change the breakdown.
	let results = preparedTestResults
		.filter(result => !result.statsPerTarget.some(stats => stats.isOffline))
		.sort((a, b) => a.clientSideId - b.clientSideId);

	if (results.length < MIN_ONLINE_PROBES) {
		return null;
	}

	let breakdown = locations.length <= 1
		? inferMeasurementBreakdown({ results, metrics: SPLIT_METRICS_BY_TYPE[testType], targetCount: targetStats.length })
		: getExplicitBreakdown({ locations, results });

	if (!breakdown) {
		return null;
	}

	return {
		title: breakdown.title,
		offlineCount: preparedTestResults.length - results.length,
		columns: breakdown.groups.map(group => ({ location: group.label, probeCount: group.results.length })),
		targets: buildTargets(breakdown.groups, {
			httpSizeMode,
			probesMaxTiming,
			targetNames: targetStats.map(stats => stats.target),
			testType,
		}),
	};
};

module.exports = { buildMeasurementBreakdown };
