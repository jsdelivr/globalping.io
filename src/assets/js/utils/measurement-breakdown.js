const _ = require('../_');
const { getLocationLabel, isWorldLocation, matchProbesToLocations } = require('./measurement-locations');
const { compareDisplayValues, compareGroups, inferMeasurementBreakdown } = require('./measurement-breakdown-inference');

const EMPTY_VALUE = '\u2014';
const MIN_ONLINE_PROBES = 10;

const isDnsError = status => status !== 'NOERROR';
const isHttpError = status => status >= 400;

const isNegligibleTimeDifference = (previous, current) => current - previous < 10 || current - previous < previous * 0.5;
const isNegligibleLossDifference = (previous, current) => current - previous < 10;

const createTimingMetric = (label, format) => ({
	key: 'timing',
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
	key: 'packetLoss',
	label: 'Packet loss',
	kind: 'numeric',
	units: '%',
	isNegligibleDifference: isNegligibleLossDifference,
	format: value => Math.round(value * 10) / 10,
	getValue: stats => stats.packetLoss,
};

const DNS_STATUS = {
	key: 'dnsStatus',
	label: 'DNS status',
	kind: 'categorical',
	isProblem: isDnsError,
	getValue: stats => stats.dnsStatus,
};

const HTTP_STATUS = {
	key: 'httpStatus',
	label: 'HTTP status',
	kind: 'categorical',
	isProblem: isHttpError,
	getValue: stats => stats.httpStatus,
};

const TLS_ERRORS = {
	key: 'tlsErrors',
	label: 'TLS errors',
	kind: 'count',
	optional: true,
	isProblem: count => count > 0,
	matches: stats => stats.tls?.authorized === false,
};

const ZERO_ANSWERS = {
	key: 'zeroAnswers',
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
	key: 'failures',
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
	http: [ HTTP_STATUS, TLS_ERRORS, RESPONSE_TIME, FAILURES ],
};

// The inference splits on single per-probe values; each split metric's key names the row it explains.
const FAILURE_SPLIT = { key: 'failures', kind: 'categorical', getValue: stats => getFailure(stats) ?? 'None' };

const ZERO_ANSWERS_SPLIT = {
	key: 'zeroAnswers',
	kind: 'categorical',
	getValue: stats => stats.dnsAnswerCount === null ? null : ZERO_ANSWERS.matches(stats),
};

const SPLIT_METRICS_BY_TYPE = {
	ping: [ FAILURE_SPLIT, PACKET_LOSS, LATENCY ],
	traceroute: [ FAILURE_SPLIT, LATENCY ],
	mtr: [ FAILURE_SPLIT, PACKET_LOSS, LATENCY ],
	dns: [ FAILURE_SPLIT, DNS_STATUS, ZERO_ANSWERS_SPLIT, QUERY_TIME ],
	http: [ FAILURE_SPLIT, HTTP_STATUS, RESPONSE_TIME ],
};

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

	let statistics = values.map(metric.format);

	return {
		values,
		statistics: statistics.every(statistic => statistic === statistics[0]) ? [ statistics[0] ] : statistics,
		isMuted: values.every(value => value === 0),
	};
};

const summarizeCategories = (metric, statsList) => {
	let counts = new Map();

	for (let value of statsList.map(metric.getValue)) {
		if (value !== null) {
			counts.set(value, (counts.get(value) || 0) + 1);
		}
	}

	if (!counts.size) {
		return null;
	}

	let items = [ ...counts.entries() ]
		.map(([ value, count ]) => ({ label: String(value), sortValue: value, count, isProblem: metric.isProblem(value) }))
		.sort((a, b) => b.count - a.count || compareDisplayValues(a, b));

	return { items };
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

// Timings use the map's colour scale, so slow values end in red, like their markers.
const getRangeScale = (metric, summaries, probesMaxTiming) => {
	if (metric.kind !== 'numeric' || !summaries.some(summary => summary.values[2] > 0)) {
		return null;
	}

	return metric.units === 'ms' ? probesMaxTiming : 100;
};

const getRange = (cell, scale) => {
	if (scale === null || !cell.values) {
		return null;
	}

	let [ min, avg, max ] = cell.values.map(value => Math.min(value / scale, 1) * 100);

	return { min, avg, max, isOverScale: cell.values[2] > scale };
};

const toMetricRow = (metric, summaries, { isNotable, rangeScale }) => {
	let cells = summaries.map(summary => summary || { value: EMPTY_VALUE, isMuted: true });

	return {
		label: metric.label,
		units: metric.units,
		isNotable,
		showsOrder: cells.some(cell => cell.statistics?.length > 1),
		cells: cells.map(cell => ({ ...cell, range: getRange(cell, rangeScale) })),
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

const buildTargets = ({ groups, notable }, { probesMaxTiming, targetNames, testType }) => {
	let metrics = METRICS_BY_TYPE[testType];
	let targetIndexes = targetNames.map((_name, index) => index);
	let shownMetrics = metrics
		.map(metric => summarizeMetric(metric, { groups, probesMaxTiming, targetIndexes }))
		.filter(({ isShown }) => isShown);

	return targetNames.map((name, targetIndex) => ({
		name,
		metricRows: shownMetrics
			.filter(({ summariesByTarget }) => summariesByTarget[targetIndex].some(Boolean))
			.map(({ metric, summariesByTarget, rangeScale }) => toMetricRow(metric, summariesByTarget[targetIndex], {
				isNotable: notable?.targetIndex === targetIndex && notable.metricKey === metric.key,
				rangeScale,
			})),
	}));
};

const buildMeasurementBreakdown = ({ locations = [], preparedTestResults, probesMaxTiming, testType }) => {
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
		hasNotable: Boolean(breakdown.notable),
		columns: breakdown.groups.map(group => ({ location: group.label, probeCount: group.results.length })),
		targets: buildTargets(breakdown, { probesMaxTiming, targetNames: targetStats.map(stats => stats.target), testType }),
	};
};

module.exports = { buildMeasurementBreakdown };
