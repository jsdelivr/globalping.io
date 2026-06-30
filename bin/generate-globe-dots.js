#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('node:util');
const got = require('got');

const DEFAULT_SOURCE_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';
const DEFAULT_OUTPUT_PATH = path.resolve(__dirname, './globe-dots.json');
const DEFAULT_STEP = 1.4;
const DEFAULT_LAT_MIN = -58;
const DEFAULT_LAT_MAX = 84;
const DEFAULT_LON_MIN = -180;
const DEFAULT_LON_MAX = 180;
const ANTARCTICA_NAME = 'Antarctica';
const EPSILON = 1e-9;

const roundCoordinate = value => Number(value.toFixed(6));

const printHelp = () => {
	console.log(`
Usage:
	node bin/generate-globe-dots.js [options]

Options:
	--step <number>       Grid step in degrees. Smaller means denser output. Default: ${DEFAULT_STEP}
	--output <path>       Output JSON path. Default: ${DEFAULT_OUTPUT_PATH}
	--source <url>        GeoJSON source URL. Default: ${DEFAULT_SOURCE_URL}
	--lat-min <number>    Southern sampling bound. Default: ${DEFAULT_LAT_MIN}
	--lat-max <number>    Northern sampling bound. Default: ${DEFAULT_LAT_MAX}
	--lon-min <number>    Western sampling bound. Default: ${DEFAULT_LON_MIN}
	--lon-max <number>    Eastern sampling bound. Default: ${DEFAULT_LON_MAX}
	-h, --help            Show this help

Examples:
	npm run generate:globe-dots
	npm run generate:globe-dots -- --step 1.2
`.trim());
};

const parseNumber = (label, value, { positive = false } = {}) => {
	let parsed = Number(value);

	if (!Number.isFinite(parsed)) {
		throw new Error(`Invalid ${label}: ${value}`);
	}

	if (positive && parsed <= 0) {
		throw new Error(`${label} must be greater than 0`);
	}

	return parsed;
};

const pointInRing = (lon, lat, ring) => {
	let inside = false;

	for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index++) {
		let [ x1, y1 ] = ring[index];
		let [ x2, y2 ] = ring[previousIndex];
		let intersects = ((y1 > lat) !== (y2 > lat))
			&& (lon < (((x2 - x1) * (lat - y1)) / ((y2 - y1) || Number.EPSILON)) + x1);

		if (intersects) {
			inside = !inside;
		}
	}

	return inside;
};

const pointInPolygon = (lon, lat, rings) => {
	if (!pointInRing(lon, lat, rings[0])) {
		return false;
	}

	for (let index = 1; index < rings.length; index++) {
		if (pointInRing(lon, lat, rings[index])) {
			return false;
		}
	}

	return true;
};

const getRingBounds = (ring) => {
	let bounds = {
		minLon: Infinity,
		maxLon: -Infinity,
		minLat: Infinity,
		maxLat: -Infinity,
	};

	for (let [ lon, lat ] of ring) {
		bounds.minLon = Math.min(bounds.minLon, lon);
		bounds.maxLon = Math.max(bounds.maxLon, lon);
		bounds.minLat = Math.min(bounds.minLat, lat);
		bounds.maxLat = Math.max(bounds.maxLat, lat);
	}

	return bounds;
};

const normalizePolygons = (features) => {
	let polygons = [];

	for (let feature of features) {
		if (!feature.geometry || feature.properties?.name === ANTARCTICA_NAME) {
			continue;
		}

		let sourcePolygons = feature.geometry.type === 'Polygon'
			? [ feature.geometry.coordinates ]
			: feature.geometry.type === 'MultiPolygon'
				? feature.geometry.coordinates
				: [];

		for (let rings of sourcePolygons) {
			if (!rings.length) {
				continue;
			}

			polygons.push({
				bounds: getRingBounds(rings[0]),
				rings,
			});
		}
	}

	return polygons;
};

const isPointOnLand = (lon, lat, polygons) => {
	for (let polygon of polygons) {
		let { bounds } = polygon;

		if (lon < bounds.minLon || lon > bounds.maxLon || lat < bounds.minLat || lat > bounds.maxLat) {
			continue;
		}

		if (pointInPolygon(lon, lat, polygon.rings)) {
			return true;
		}
	}

	return false;
};

const finalizeRuns = (runs, activeRunStart, activeRunLength) => {
	if (activeRunStart !== null) {
		runs.push(activeRunStart, activeRunLength);
	}
};

const generateRows = ({ step, latMin, latMax, lonMin, lonMax }, polygons) => {
	let rowCount = Math.floor(((latMax - latMin) / step) + EPSILON) + 1;
	let columnCount = Math.floor(((lonMax - lonMin) / step) + EPSILON);
	let rows = [];
	let totalDots = 0;

	for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
		let lat = roundCoordinate(latMin + (rowIndex * step));
		let runs = [];
		let activeRunStart = null;
		let activeRunLength = 0;

		for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
			let lon = roundCoordinate(lonMin + (columnIndex * step));
			let onLand = isPointOnLand(lon, lat, polygons);

			if (onLand) {
				if (activeRunStart === null) {
					activeRunStart = columnIndex;
					activeRunLength = 1;
				} else {
					activeRunLength++;
				}

				continue;
			}

			if (activeRunStart !== null) {
				runs.push(activeRunStart, activeRunLength);
				totalDots += activeRunLength;
				activeRunStart = null;
				activeRunLength = 0;
			}
		}

		finalizeRuns(runs, activeRunStart, activeRunLength);

		if (activeRunStart !== null) {
			totalDots += activeRunLength;
		}

		rows.push(runs);
	}

	return {
		rowCount,
		columnCount,
		rows,
		totalDots,
	};
};

const trimRows = ({ rows, latMin, step }) => {
	let firstNonEmptyRow = rows.findIndex(row => row.length > 0);
	let lastNonEmptyRow = rows.length - 1;

	while (lastNonEmptyRow >= 0 && rows[lastNonEmptyRow].length === 0) {
		lastNonEmptyRow--;
	}

	if (firstNonEmptyRow === -1 || lastNonEmptyRow < firstNonEmptyRow) {
		throw new Error('No land dots were generated');
	}

	return {
		lat0: roundCoordinate(latMin + (firstNonEmptyRow * step)),
		rows: rows.slice(firstNonEmptyRow, lastNonEmptyRow + 1),
	};
};

async function main () {
	let { values } = parseArgs({
		options: {
			'step': { type: 'string' },
			'output': { type: 'string' },
			'source': { type: 'string' },
			'lat-min': { type: 'string' },
			'lat-max': { type: 'string' },
			'lon-min': { type: 'string' },
			'lon-max': { type: 'string' },
			'help': { type: 'boolean', short: 'h' },
		},
	});

	if (values.help) {
		printHelp();
		return;
	}

	let step = parseNumber('step', values.step ?? DEFAULT_STEP, { positive: true });
	let latMin = parseNumber('lat-min', values['lat-min'] ?? DEFAULT_LAT_MIN);
	let latMax = parseNumber('lat-max', values['lat-max'] ?? DEFAULT_LAT_MAX);
	let lonMin = parseNumber('lon-min', values['lon-min'] ?? DEFAULT_LON_MIN);
	let lonMax = parseNumber('lon-max', values['lon-max'] ?? DEFAULT_LON_MAX);
	let outputPath = path.resolve(process.cwd(), values.output ?? DEFAULT_OUTPUT_PATH);
	let sourceUrl = values.source ?? DEFAULT_SOURCE_URL;

	if (latMin >= latMax) {
		throw new Error('lat-min must be less than lat-max');
	}

	if (lonMin >= lonMax) {
		throw new Error('lon-min must be less than lon-max');
	}

	let geojson = await got(sourceUrl).json();
	let polygons = normalizePolygons(geojson.features || []);
	let generated = generateRows({ step, latMin, latMax, lonMin, lonMax }, polygons);
	let trimmed = trimRows({ rows: generated.rows, latMin, step });
	let packed = {
		lat0: trimmed.lat0,
		lon0: lonMin,
		step,
		rows: trimmed.rows,
	};

	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, `${JSON.stringify(packed, null, '\t')}\n`, 'utf8');

	console.log(`Saved ${generated.totalDots} globe dots to ${outputPath}`);
	console.log(`Step: ${step} degrees`);
	console.log(`Rows: ${trimmed.rows.length}, columns sampled: ${generated.columnCount}`);
}

main().catch((error) => {
	console.error('Failed to generate globe dots:', error.message);
	process.exit(1);
});
