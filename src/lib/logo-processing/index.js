const sharp = require('sharp');

const LUMINANCE_THRESHOLD = 230;
const ALPHA_THRESHOLD = 0.1;
const TRIM_TOLERANCE = 10;
const DEFAULT_DOMAIN_PADDING = 10;
const FALLBACK_PADDING_RATIO = .175;
const MIN_FILLED_CORNERS = 3;
const CIRCLE_COVERAGE_TARGET = .5;
const MIN_CIRCLE_FIT_SCALE = .75;
const ROUND_AVATAR_COVERAGE = .9;

/**
 * Extracts the RGBA colors of the 4 corners of the image.
 */
const getCornerColors = ({ data, info }) => {
	let { width, height, channels } = info;
	let getPixelIndex = (x, y) => (y * width + x) * channels;

	return [
		getPixelIndex(0, 0),
		getPixelIndex(width - 1, 0),
		getPixelIndex(0, height - 1),
		getPixelIndex(width - 1, height - 1),
	].map(idx => ({
		r: data[idx],
		g: data[idx + 1],
		b: data[idx + 2],
		a: data[idx + 3],
	}));
};

const getAverageColor = (colors) => {
	let average = channel => Math.round(colors.reduce((sum, color) => sum + color[channel], 0) / colors.length);

	return {
		r: average('r'),
		g: average('g'),
		b: average('b'),
		alpha: average('a') / 255,
	};
};

/**
 * Trims the transparent margins and scales the content toward a target share of a centered circle,
 * without going past the circle or below a fraction of the size that touches it.
 * Content that already fills the circle almost entirely is treated as a round avatar and touches the circle.
 */
const fitInCircle = async (pixels, size, padding) => {
	let circleRadius = (size / 2) - padding;

	if (circleRadius <= 0) {
		throw new Error('Padding is too large for the image dimensions.');
	}

	let { data, info } = await sharp(pixels.data, { raw: { width: pixels.info.width, height: pixels.info.height, channels: pixels.info.channels } })
		.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: TRIM_TOLERANCE })
		.raw()
		.toBuffer({ resolveWithObject: true });

	let contentRadius = 0;
	let contentArea = 0;

	for (let y = 0; y < info.height; y++) {
		for (let x = 0; x < info.width; x++) {
			let alpha = data[(((y * info.width) + x) * info.channels) + 3] / 255;
			contentArea += alpha;

			if (alpha > ALPHA_THRESHOLD) {
				contentRadius = Math.max(contentRadius, Math.hypot(x + .5 - (info.width / 2), y + .5 - (info.height / 2)));
			}
		}
	}

	let fitScale = circleRadius / (contentRadius + Math.SQRT1_2);
	let circleArea = Math.PI * (circleRadius ** 2);
	let coverageScale = Math.sqrt(CIRCLE_COVERAGE_TARGET * circleArea / contentArea);
	let scale = contentArea * (fitScale ** 2) / circleArea >= ROUND_AVATAR_COVERAGE
		? fitScale
		: Math.min(fitScale, Math.max(coverageScale, fitScale * MIN_CIRCLE_FIT_SCALE));
	// faint pixels are trimmed into the content without counting towards its radius, so keep all of it on the canvas
	scale = Math.min(scale, size / Math.max(info.width, info.height));
	// round down to the canvas parity, so the content is centered exactly and never grows past the circle
	let fitSide = side => Math.max(1, size - (2 * Math.ceil((size - (side * scale)) / 2)));
	let width = fitSide(info.width);
	let height = fitSide(info.height);
	let left = Math.round((size - width) / 2);
	let top = Math.round((size - height) / 2);

	return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
		.resize(width, height, { fit: 'fill' })
		.extend({
			top,
			bottom: size - height - top,
			left,
			right: size - width - left,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png()
		.toBuffer();
};

/**
 * See https://en.wikipedia.org/wiki/Relative_luminance
 */
const calculateLuminance = (r, g, b) => {
	return (0.299 * r) + (0.587 * g) + (0.114 * b);
};

/**
 * Applies padding while maintaining the dimensions of the image
 */
const applyPadding = (sharpInstance, metadata, padding, bgColor) => {
	let aspectRatio = metadata.width / metadata.height;
	let horizontalPadding = Math.round(padding * aspectRatio);

	let innerWidth = metadata.width - (2 * horizontalPadding);
	let innerHeight = metadata.height - (2 * padding);

	if (innerWidth <= 0 || innerHeight <= 0) {
		throw new Error('Padding is too large for the image dimensions.');
	}

	let topPad = Math.floor((metadata.height - innerHeight) / 2);
	let bottomPad = metadata.height - innerHeight - topPad;
	let leftPad = Math.floor((metadata.width - innerWidth) / 2);
	let rightPad = metadata.width - innerWidth - leftPad;

	return sharpInstance
		.resize({
			width: innerWidth,
			height: innerHeight,
			fit: 'fill',
		})
		.extend({
			top: topPad,
			bottom: bottomPad,
			left: leftPad,
			right: rightPad,
			background: bgColor,
		});
};

const processLogo = async (imageBuffer, { padding, size, defaultPadding, trimBackground = false, fitTransparentInCircle = false, extraPaddingRatio = 0 }) => {
	let hasCustomPadding = padding !== null;
	let sharpInstance = sharp(imageBuffer);

	let metadata = await sharpInstance.metadata();
	let originalWidth = metadata.width;
	let aspectRatio = metadata.width / metadata.height;
	padding = padding ?? defaultPadding;

	let pixels = await sharp(imageBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	let cornerColors = getCornerColors(pixels);
	let bgColor = getAverageColor(cornerColors);
	let luminance = calculateLuminance(bgColor.r, bgColor.g, bgColor.b);
	let hasFilledBackground = cornerColors.filter(color => color.a > ALPHA_THRESHOLD * 255).length >= MIN_FILLED_CORNERS;

	if (fitTransparentInCircle && !hasFilledBackground) {
		return fitInCircle(pixels, size ?? metadata.width, padding);
	}

	// if the background is light enough, trim the logo
	if (trimBackground && (luminance >= LUMINANCE_THRESHOLD || bgColor.alpha <= ALPHA_THRESHOLD)) {
		// trim without maintaining the aspect ratio or center pixel
		let { info: trimInfo } = await sharp(imageBuffer)
			.trim({
				background: bgColor,
				threshold: TRIM_TOLERANCE,
			})
			.toBuffer({ resolveWithObject: true });

		// find margins of the trim
		let leftMargin = Math.abs(trimInfo.trimOffsetLeft || 0);
		let topMargin = Math.abs(trimInfo.trimOffsetTop || 0);
		let rightMargin = metadata.width - trimInfo.width - leftMargin;
		let bottomMargin = metadata.height - trimInfo.height - topMargin;

		// find the maximum safe trim boundaries on each axis
		let maxSafeTrimX = Math.min(leftMargin, rightMargin);
		let maxSafeTrimY = Math.min(topMargin, bottomMargin);

		// ensure the trim maintains the aspect ratio and is centered on the image
		let finalTrimY = Math.min(maxSafeTrimY, maxSafeTrimX / aspectRatio);
		let finalTrimX = finalTrimY * aspectRatio;

		finalTrimX = Math.floor(finalTrimX);
		finalTrimY = Math.floor(finalTrimY);

		// apply the trim
		if (finalTrimX > 0 || finalTrimY > 0) {
			sharpInstance = sharpInstance.extract({
				left: finalTrimX,
				top: finalTrimY,
				width: metadata.width - (finalTrimX * 2),
				height: metadata.height - (finalTrimY * 2),
			});

			metadata = {
				...metadata,
				width: metadata.width - (finalTrimX * 2),
				height: metadata.height - (finalTrimY * 2),
			};
		}
	}

	padding += Math.round(metadata.width * extraPaddingRatio);

	if (size) {
		let aspectRatio = metadata.width / metadata.height;

		if (!hasCustomPadding) {
			padding = Math.round(padding * size / originalWidth);
		}

		sharpInstance = sharpInstance.resize({
			width: size,
			fit: 'inside',
			withoutEnlargement: false,
		});

		metadata = {
			...metadata,
			width: size,
			height: Math.round(size / aspectRatio),
		};
	}

	if (padding) {
		sharpInstance = applyPadding(sharpInstance, metadata, padding, bgColor);
	}

	return sharpInstance.png().toBuffer();
};

const fetchLogo = url => fetch(url, { headers: { Accept: 'image/png' } });

const processLogoResponse = async (response, options) => {
	if (!response.ok) {
		return {
			error: {
				status: response.status,
				message: response.statusText || 'Failed to fetch upstream image',
			},
		};
	}

	let imageBuffer = Buffer.from(await response.arrayBuffer());

	return { image: await processLogo(imageBuffer, options) };
};

const processingError = { error: { status: 500, message: 'Failed to process logo' } };

module.exports.getDomainLogo = async (domain, padding, size) => {
	let defaultUrl = `https://img.jsdelivr.com/img.logo.dev/${domain}?format=png`;
	let strictUrl = `${defaultUrl}&fallback=404`; // forces a 404 response if the logo is unavailable

	try {
		let response = await fetchLogo(strictUrl);
		let isFallback = response.status === 404;

		if (isFallback) {
			response = await fetchLogo(defaultUrl);
		}

		return await processLogoResponse(response, {
			padding,
			size,
			defaultPadding: DEFAULT_DOMAIN_PADDING,
			trimBackground: true,
			extraPaddingRatio: isFallback ? FALLBACK_PADDING_RATIO : 0,
		});
	} catch {
		return processingError;
	}
};

module.exports.getGitHubLogo = async (username, padding, size) => {
	try {
		let response = await fetchLogo(`https://img.jsdelivr.com/github.com/${username}.png`);

		return await processLogoResponse(response, {
			padding,
			size,
			defaultPadding: 0,
			fitTransparentInCircle: true,
		});
	} catch {
		return processingError;
	}
};
