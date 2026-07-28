#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { parseArgs } = require('node:util');
const ffmpegPath = require('ffmpeg-static');
const sharp = require('sharp');

const DEFAULT_INPUT_PATH = path.resolve(__dirname, './globe-dots.json');
const DEFAULT_OUTPUT_PATH = path.resolve(__dirname, '../src/assets/img/globe-video.webm');
const DEFAULT_POSTER_OUTPUT_PATH = path.resolve(__dirname, '../src/assets/img/globe-poster.webp');
const DEFAULT_SIZE = 1200;
const DEFAULT_FPS = 24;
const DEFAULT_DURATION = 40;
const DEFAULT_VISIBLE_ROWS_PERCENT = 1;
const DEFAULT_ROTATION_DEGREES = -360;
const DEFAULT_CRF = 34;
const DEFAULT_POSTER_TIME = 1.2;
const DEFAULT_PULSE_CYCLES = 10;
const DEFAULT_PULSE_GLOBE_FORESHORTENING = true;
const OUTPUT_HEIGHT_RATIO = .5;
const SVG_NS = 'http://www.w3.org/2000/svg';
const DEG_TO_RAD = Math.PI / 180;
const GLOBE_CENTER = 600;
const GLOBE_RADIUS = 560;
const GLOBE_TILT = -4 * DEG_TO_RAD;
const GLOBE_TILT_SIN = Math.sin(GLOBE_TILT);
const GLOBE_TILT_COS = Math.cos(GLOBE_TILT);
const INITIAL_ROTATION = 90 * DEG_TO_RAD;
const MIN_DOT_OPACITY = .35;
const MAX_DOT_OPACITY = .95;
const DOT_OPACITY_RANGE = MAX_DOT_OPACITY - MIN_DOT_OPACITY;
const MIN_DOT_RADIUS = 1.22;
const MAX_DOT_RADIUS = 2.22;
const DOT_RADIUS_RANGE = MAX_DOT_RADIUS - MIN_DOT_RADIUS;
const PULSE_DEPTH_THRESHOLD = .16;
const PULSE_RADIUS_BASE = 1.92;
const PULSE_RADIUS_RANGE = 2.56;
const PULSE_OPACITY_BASE = .25;
const PULSE_OPACITY_RANGE = .8;
const PULSE_PHASE_OFFSETS = [ .08, .24, .39, .56, .71, .86 ];
const PULSE_WIDTH = .32;
const GOLDEN_RATIO_CONJUGATE = .61803398875;

const printHelp = () => {
	console.log(`
Usage:
	node bin/generate-globe-video.js [options]

Options:
	--input <path>                   Globe dots json data. Default: ${DEFAULT_INPUT_PATH}
	--output <path>                  WebM output path. Default: ${DEFAULT_OUTPUT_PATH}
	--poster-output <path>           Poster output path. Default: ${DEFAULT_POSTER_OUTPUT_PATH}
	--size <number>                  Output width in pixels; height is half the width. Default: ${DEFAULT_SIZE}
	--fps <number>                   Frames per second. Default: ${DEFAULT_FPS}
	--duration <number>              Loop duration in seconds. Default: ${DEFAULT_DURATION}
	--visible-rows-percent <number>  Globe rows to render, 0-1 or 0-100. Default: ${DEFAULT_VISIBLE_ROWS_PERCENT}
	--rotation-degrees <number>      Degrees per loop. Use 360/-360 for a seamless spin. Default: ${DEFAULT_ROTATION_DEGREES}
	--poster-time <number>           Poster timestamp in seconds. Default: ${DEFAULT_POSTER_TIME}
	--pulse-cycles <number>          Pulse animation cycles per video loop. Default: ${DEFAULT_PULSE_CYCLES}
	--pulse-globe-foreshortening <true|false>
	                                 Foreshorten pulse rings against the globe surface. Default: ${DEFAULT_PULSE_GLOBE_FORESHORTENING}
	--crf <number>                   VP9 quality, lower is larger/better. Default: ${DEFAULT_CRF}
	--frames-dir <path>              Directory for intermediate PNG frames.
	--keep-frames                    Keep intermediate PNG frames.
	--skip-video                     Render only the poster.
	-h, --help                       Show this help

Examples:
	npm run generate:globe-video
	npm run generate:globe-video -- --duration 56 --fps 24 --crf 32
	node bin/generate-globe-video.js --skip-video --poster-output ./tmp/globe-poster.webp
`.trim());
};

const parseNumber = (label, value, { integer = false, min = -Infinity, max = Infinity } = {}) => {
	let parsed = Number(value);

	if (!Number.isFinite(parsed)) {
		throw new Error(`Invalid ${label}: ${value}`);
	}

	if (integer && !Number.isInteger(parsed)) {
		throw new Error(`${label} must be an integer`);
	}

	if (parsed < min || parsed > max) {
		throw new Error(`${label} must be between ${min} and ${max}`);
	}

	return parsed;
};

const parseBoolean = (label, value) => {
	if (typeof value === 'boolean') {
		return value;
	}

	if (typeof value !== 'string') {
		throw new Error(`Invalid ${label}: ${value}`);
	}

	let normalized = value.trim().toLowerCase();

	if (normalized === 'true') {
		return true;
	}

	if (normalized === 'false') {
		return false;
	}

	throw new Error(`${label} must be true or false`);
};

const clampVisibleRowsPercent = (value) => {
	let percent = Number(value);

	if (!Number.isFinite(percent)) {
		return DEFAULT_VISIBLE_ROWS_PERCENT;
	}

	if (percent > 1) {
		percent /= 100;
	}

	return Math.max(0, Math.min(percent, 1));
};

const getVisiblePackedRows = ({ lat0, lon0, step, rows }, visibleRowsPercent) => {
	let visiblePercent = clampVisibleRowsPercent(visibleRowsPercent);
	let visibleRowCount = Math.ceil(rows.length * visiblePercent);
	let startRowIndex = Math.max(rows.length - visibleRowCount, 0);

	return {
		lat0: lat0 + (startRowIndex * step),
		lon0,
		step,
		rows: rows.slice(startRowIndex),
	};
};

const unpackGlobeDots = ({ lat0, lon0, step, rows }) => {
	let dotCount = rows.reduce((count, runs) => {
		for (let runIndex = 0; runIndex < runs.length; runIndex += 2) {
			count += runs[runIndex + 1];
		}

		return count;
	}, 0);
	let sinLongitudes = new Float32Array(dotCount);
	let cosLongitudes = new Float32Array(dotCount);
	let sinLatitudes = new Float32Array(dotCount);
	let cosLatitudes = new Float32Array(dotCount);
	let longitudeBase = lon0 * DEG_TO_RAD;
	let longitudeStep = step * DEG_TO_RAD;
	let dotIndex = 0;

	for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
		let runs = rows[rowIndex];
		let latitude = (lat0 + (rowIndex * step)) * DEG_TO_RAD;
		let sinLatitude = Math.sin(latitude);
		let cosLatitude = Math.cos(latitude);

		for (let runIndex = 0; runIndex < runs.length; runIndex += 2) {
			let start = runs[runIndex];
			let length = runs[runIndex + 1];

			for (let column = start; column < start + length; column++) {
				let longitude = longitudeBase + (column * longitudeStep);

				sinLongitudes[dotIndex] = Math.sin(longitude);
				cosLongitudes[dotIndex] = Math.cos(longitude);
				sinLatitudes[dotIndex] = sinLatitude;
				cosLatitudes[dotIndex] = cosLatitude;
				dotIndex++;
			}
		}
	}

	return {
		count: dotCount,
		sinLongitudes,
		cosLongitudes,
		sinLatitudes,
		cosLatitudes,
	};
};

const formatNumber = value => Number(value.toFixed(3));

const projectDots = (dots, rotation) => {
	let { sinLongitudes, cosLongitudes, sinLatitudes, cosLatitudes, count } = dots;
	let sinRotation = Math.sin(rotation);
	let cosRotation = Math.cos(rotation);
	let projected = [];

	for (let index = 0; index < count; index++) {
		let sinLongitude = (sinLongitudes[index] * cosRotation) + (cosLongitudes[index] * sinRotation);
		let cosLongitude = (cosLongitudes[index] * cosRotation) - (sinLongitudes[index] * sinRotation);
		let x = cosLatitudes[index] * sinLongitude;
		let y = (sinLatitudes[index] * GLOBE_TILT_COS) - (cosLatitudes[index] * cosLongitude * GLOBE_TILT_SIN);
		let depth = (sinLatitudes[index] * GLOBE_TILT_SIN) + (cosLatitudes[index] * cosLongitude * GLOBE_TILT_COS);

		if (depth <= 0) {
			continue;
		}

		projected.push({
			index,
			x: GLOBE_CENTER + (GLOBE_RADIUS * x),
			y: GLOBE_CENTER - (GLOBE_RADIUS * y),
			depth,
			radius: MIN_DOT_RADIUS + (DOT_RADIUS_RANGE * depth),
			pulseAngle: Math.atan2(x, y) * (180 / Math.PI),
			pulseSquash: depth,
		});
	}

	return projected;
};

const getPulseTargetFraction = (cycleIndex, offsetIndex) => {
	return ((offsetIndex + 1) * GOLDEN_RATIO_CONJUGATE + (cycleIndex * .41)) % 1;
};

const buildPulseWindows = ({ dots, pulseCycles, rotationDegrees }) => {
	let pulseWindows = [];

	for (let cycleIndex = 0; cycleIndex < pulseCycles; cycleIndex++) {
		for (let offsetIndex = 0; offsetIndex < PULSE_PHASE_OFFSETS.length; offsetIndex++) {
			let offset = PULSE_PHASE_OFFSETS[offsetIndex];
			let startPosition = cycleIndex + offset;
			let endPosition = startPosition + PULSE_WIDTH;

			if (startPosition >= pulseCycles || endPosition >= pulseCycles) {
				continue;
			}

			let progress = startPosition / pulseCycles;
			let rotation = INITIAL_ROTATION + (rotationDegrees * DEG_TO_RAD * progress);
			let projected = projectDots(dots, rotation).filter(dot => dot.depth > PULSE_DEPTH_THRESHOLD);

			if (!projected.length) {
				continue;
			}

			let targetFraction = getPulseTargetFraction(cycleIndex, offsetIndex);
			let targetIndex = Math.min(Math.floor(projected.length * targetFraction), projected.length - 1);
			let dotIndex = projected[targetIndex]?.index;

			if (dotIndex === undefined) {
				continue;
			}

			pulseWindows.push({
				dotIndex,
				startPosition,
			});
		}
	}

	return pulseWindows;
};

const getPulseIntensity = (progress, pulseWindow, pulseCycles) => {
	let loopPosition = progress * pulseCycles;
	let pulsePhase = loopPosition - pulseWindow.startPosition;

	if (pulsePhase < 0 || pulsePhase > PULSE_WIDTH) {
		return 0;
	}

	return Math.sin((pulsePhase / PULSE_WIDTH) * Math.PI);
};

const renderFrameSvg = ({ dots, pulseWindows, progress, rotationDegrees, pulseCycles, pulseGlobeForeshortening }) => {
	let rotation = INITIAL_ROTATION + (rotationDegrees * DEG_TO_RAD * progress);
	let projected = projectDots(dots, rotation);
	let projectedByIndex = new Map(projected.map(dot => [ dot.index, dot ]));
	let circles = [];

	for (let dot of projected) {
		let opacity = MIN_DOT_OPACITY + (DOT_OPACITY_RANGE * dot.depth);

		circles.push(`<circle cx="${formatNumber(dot.x)}" cy="${formatNumber(dot.y)}" r="${formatNumber(dot.radius)}" fill-opacity="${formatNumber(opacity)}"/>`);
	}

	let pulseCircles = pulseWindows.map((pulseWindow) => {
		let intensity = getPulseIntensity(progress, pulseWindow, pulseCycles);

		if (intensity <= 0) {
			return '';
		}

		let dot = projectedByIndex.get(pulseWindow.dotIndex);

		if (!dot || dot.depth <= PULSE_DEPTH_THRESHOLD) {
			return '';
		}

		let radius = dot.radius + PULSE_RADIUS_BASE + (intensity * PULSE_RADIUS_RANGE);
		let opacity = Math.min(PULSE_OPACITY_BASE + (intensity * PULSE_OPACITY_RANGE), 1);

		if (!pulseGlobeForeshortening) {
			return `<circle cx="${formatNumber(dot.x)}" cy="${formatNumber(dot.y)}" r="${formatNumber(radius)}" fill-opacity="${formatNumber(opacity)}"/>`;
		}

		let minorRadius = radius * dot.pulseSquash;

		return `<ellipse cx="${formatNumber(dot.x)}" cy="${formatNumber(dot.y)}" rx="${formatNumber(radius)}" ry="${formatNumber(minorRadius)}" transform="rotate(${formatNumber(dot.pulseAngle)} ${formatNumber(dot.x)} ${formatNumber(dot.y)})" fill-opacity="${formatNumber(opacity)}"/>`;
	}).join('');

	return `
<svg xmlns="${SVG_NS}" viewBox="0 0 1200 1200" width="1200" height="1200">
	<defs>
		<clipPath id="globe-clip">
			<circle cx="600" cy="600" r="560"/>
		</clipPath>
		<filter id="pulse-filter" x="-200%" y="-200%" width="400%" height="400%">
			<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
			<feMerge>
				<feMergeNode in="blur"/>
				<feMergeNode in="SourceGraphic"/>
			</feMerge>
		</filter>
	</defs>
	<circle cx="600" cy="600" r="560" fill="#17233a"/>
	<g fill="#5074b8" clip-path="url(#globe-clip)">
		${circles.join('\n\t\t')}
	</g>
	<g fill="#17d4a7" clip-path="url(#globe-clip)" filter="url(#pulse-filter)">
		${pulseCircles}
	</g>
	<circle cx="600" cy="600" r="560" fill="none" stroke="#365590" stroke-width="1.5"/>
</svg>
`.trim();
};

const renderPngFrame = async ({ dots, pulseWindows, progress, rotationDegrees, pulseCycles, pulseGlobeForeshortening, outputPath, size }) => {
	let svg = renderFrameSvg({ dots, pulseWindows, progress, rotationDegrees, pulseCycles, pulseGlobeForeshortening });

	await sharp(Buffer.from(svg))
		.resize(size, size)
		.extract({ left: 0, top: 0, width: size, height: Math.floor(size * OUTPUT_HEIGHT_RATIO) })
		.png()
		.toFile(outputPath);
};

const renderPoster = async ({ dots, pulseWindows, options }) => {
	let progress = (options.posterTime % options.duration) / options.duration;
	let svg = renderFrameSvg({
		dots,
		pulseWindows,
		progress,
		rotationDegrees: options.rotationDegrees,
		pulseCycles: options.pulseCycles,
		pulseGlobeForeshortening: options.pulseGlobeForeshortening,
	});
	let poster = sharp(Buffer.from(svg))
		.resize(options.size, options.size)
		.extract({ left: 0, top: 0, width: options.size, height: Math.floor(options.size * OUTPUT_HEIGHT_RATIO) });

	fs.mkdirSync(path.dirname(options.posterOutputPath), { recursive: true });

	if (options.posterOutputPath.endsWith('.png')) {
		await poster.png().toFile(options.posterOutputPath);
		return;
	}

	await poster.webp({ quality: 92, lossless: false }).toFile(options.posterOutputPath);
};

const assertFfmpegAvailable = () => {
	if (!ffmpegPath) {
		throw new Error('ffmpeg-static did not resolve an ffmpeg binary. Use --skip-video to render only the poster.');
	}

	let result = spawnSync(ffmpegPath, [ '-version' ], { stdio: 'ignore' });

	if (result.error) {
		throw new Error('ffmpeg-static binary could not be executed. Use --skip-video to render only the poster.');
	}
};

const encodeWebm = ({ framesDir, fps, crf, outputPath }) => {
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });

	let result = spawnSync(ffmpegPath, [
		'-y',
		'-hide_banner',
		'-loglevel',
		'warning',
		'-stats',
		'-framerate',
		String(fps),
		'-i',
		path.join(framesDir, 'frame-%04d.png'),
		'-c:v',
		'libvpx-vp9',
		'-pix_fmt',
		'yuva420p',
		'-auto-alt-ref',
		'0',
		'-b:v',
		'0',
		'-crf',
		String(crf),
		'-an',
		outputPath,
	], { stdio: 'inherit' });

	if (result.status !== 0) {
		throw new Error(`ffmpeg failed with exit code ${result.status}`);
	}
};

const removeDirectory = (directoryPath) => {
	fs.rmSync(directoryPath, { recursive: true, force: true });
};

const parseOptions = () => {
	let { values } = parseArgs({
		options: {
			'input': { type: 'string' },
			'output': { type: 'string' },
			'poster-output': { type: 'string' },
			'size': { type: 'string' },
			'fps': { type: 'string' },
			'duration': { type: 'string' },
			'visible-rows-percent': { type: 'string' },
			'rotation-degrees': { type: 'string' },
			'poster-time': { type: 'string' },
			'pulse-cycles': { type: 'string' },
			'pulse-globe-foreshortening': { type: 'string' },
			'crf': { type: 'string' },
			'frames-dir': { type: 'string' },
			'keep-frames': { type: 'boolean' },
			'skip-video': { type: 'boolean' },
			'help': { type: 'boolean', short: 'h' },
		},
	});

	if (values.help) {
		printHelp();
		process.exit(0);
	}

	return {
		inputPath: path.resolve(process.cwd(), values.input ?? DEFAULT_INPUT_PATH),
		outputPath: path.resolve(process.cwd(), values.output ?? DEFAULT_OUTPUT_PATH),
		posterOutputPath: path.resolve(process.cwd(), values['poster-output'] ?? DEFAULT_POSTER_OUTPUT_PATH),
		size: parseNumber('size', values.size ?? DEFAULT_SIZE, { integer: true, min: 2 }),
		fps: parseNumber('fps', values.fps ?? DEFAULT_FPS, { integer: true, min: 1 }),
		duration: parseNumber('duration', values.duration ?? DEFAULT_DURATION, { min: .1 }),
		visibleRowsPercent: clampVisibleRowsPercent(values['visible-rows-percent'] ?? DEFAULT_VISIBLE_ROWS_PERCENT),
		rotationDegrees: parseNumber('rotation-degrees', values['rotation-degrees'] ?? DEFAULT_ROTATION_DEGREES),
		posterTime: parseNumber('poster-time', values['poster-time'] ?? DEFAULT_POSTER_TIME, { min: 0 }),
		pulseCycles: parseNumber('pulse-cycles', values['pulse-cycles'] ?? DEFAULT_PULSE_CYCLES, { min: 1 }),
		pulseGlobeForeshortening: parseBoolean('pulse-globe-foreshortening', values['pulse-globe-foreshortening'] ?? String(DEFAULT_PULSE_GLOBE_FORESHORTENING)),
		crf: parseNumber('crf', values.crf ?? DEFAULT_CRF, { integer: true, min: 0, max: 63 }),
		framesDir: values['frames-dir'] ? path.resolve(process.cwd(), values['frames-dir']) : null,
		keepFrames: !!values['keep-frames'],
		skipVideo: !!values['skip-video'],
	};
};

async function main () {
	let options = parseOptions();
	let packedGlobeDots = require(options.inputPath);
	let dots = unpackGlobeDots(getVisiblePackedRows(packedGlobeDots, options.visibleRowsPercent));
	let pulseWindows = buildPulseWindows({
		dots,
		pulseCycles: options.pulseCycles,
		rotationDegrees: options.rotationDegrees,
	});
	let frameCount = Math.max(Math.round(options.duration * options.fps), 1);

	if (!options.skipVideo) {
		assertFfmpegAvailable();
	}

	console.log(`Rendering ${dots.count} source dots at ${options.size}x${Math.floor(options.size * OUTPUT_HEIGHT_RATIO)}`);
	await renderPoster({ dots, pulseWindows, options });
	console.log(`Saved poster: ${options.posterOutputPath}`);

	if (options.skipVideo) {
		return;
	}

	let framesDir = options.framesDir || fs.mkdtempSync(path.join(os.tmpdir(), 'globalping-globe-'));

	try {
		fs.mkdirSync(framesDir, { recursive: true });
		console.log(`Rendering ${frameCount} frames to ${framesDir}`);

		for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
			let progress = frameIndex / frameCount;
			let framePath = path.join(framesDir, `frame-${String(frameIndex).padStart(4, '0')}.png`);

			await renderPngFrame({
				dots,
				pulseWindows,
				progress,
				rotationDegrees: options.rotationDegrees,
				pulseCycles: options.pulseCycles,
				pulseGlobeForeshortening: options.pulseGlobeForeshortening,
				outputPath: framePath,
				size: options.size,
			});

			if ((frameIndex + 1) % Math.max(Math.floor(frameCount / 10), 1) === 0 || frameIndex + 1 === frameCount) {
				console.log(`Rendered ${frameIndex + 1}/${frameCount} frames`);
			}
		}

		console.log(`Encoding WebM: ${options.outputPath}`);

		encodeWebm({
			framesDir,
			fps: options.fps,
			crf: options.crf,
			outputPath: options.outputPath,
		});

		console.log(`Saved video: ${options.outputPath}`);
	} finally {
		if (!options.keepFrames && !options.framesDir) {
			removeDirectory(framesDir);
		}
	}

	console.log(`Saved video: ${options.outputPath}`);
}

main().catch((error) => {
	console.error('Failed to generate globe video:', error.message);
	process.exit(1);
});
