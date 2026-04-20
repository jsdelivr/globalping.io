const sharp = require('sharp');

const LUMINANCE_THRESHOLD = 230;
const TRIM_TOLERANCE = 10;

/**
 * Extracts and calculates the average RGBA color from the 4 corners of the image.
 */
const getCornerAverageColor = async (imageBuffer, width, height) => {
	let { data, info } = await sharp(imageBuffer)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	let channels = info.channels;

	let getPixelIndex = (x, y) => (y * width + x) * channels;

	let corners = [
		getPixelIndex(0, 0),
		getPixelIndex(width - 1, 0),
		getPixelIndex(0, height - 1),
		getPixelIndex(width - 1, height - 1),
	];

	let r = 0, g = 0, b = 0, a = 0;

	for (let idx of corners) {
		r += data[idx];
		g += data[idx + 1];
		b += data[idx + 2];
		a += data[idx + 3];
	}

	return {
		r: Math.round(r / 4),
		g: Math.round(g / 4),
		b: Math.round(b / 4),
		alpha: Math.round(a / 4) / 255,
	};
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
const applyPadding = async (sharpInstance, metadata, padding, bgColor) => {
	if (padding <= 0) {
		return sharpInstance;
	}

	let aspectRatio = metadata.width / metadata.height;

	let extendedBuffer = await sharpInstance.extend({
		top: padding,
		bottom: padding,
		left: Math.round(padding * aspectRatio),
		right: Math.round(padding * aspectRatio),
		background: bgColor,
	}).toBuffer();

	return sharp(extendedBuffer).resize({
		width: metadata.width,
		height: metadata.height,
		fit: 'contain',
		background: bgColor,
	});
};

module.exports.processDomainLogo = async (domain, padding) => {
	let defaultUrl = `https://img.jsdelivr.com/img.logo.dev/${domain}?format=png`;
	let strictUrl = `${defaultUrl}&fallback=404`; // forces a 404 response if the logo is unavailable

	try {
		let response = await fetch(strictUrl, { headers: { Accept: 'image/png' } });

		if (response.status === 404) {
			response = await fetch(defaultUrl, { headers: { Accept: 'image/png' } });
			padding += 20;
		}

		if (!response.ok) {
			return {
				error: {
					status: response.status,
					message: response.statusText || 'Failed to fetch upstream image',
				},
			};
		}

		let arrayBuffer = await response.arrayBuffer();
		let imageBuffer = Buffer.from(arrayBuffer);

		let sharpInstance = sharp(imageBuffer);

		let metadata = await sharpInstance.metadata();
		let aspectRatio = metadata.width / metadata.height;

		let bgColor = await getCornerAverageColor(imageBuffer, metadata.width, metadata.height);
		let luminance = calculateLuminance(bgColor.r, bgColor.g, bgColor.b);

		// if the background is light enough, trim the logo
		if (luminance >= LUMINANCE_THRESHOLD) {
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
			}

			sharpInstance = await applyPadding(sharpInstance, metadata, padding, bgColor);
		} else if (bgColor.alpha === 0) {
			sharpInstance = await applyPadding(sharpInstance, metadata, padding, bgColor);
		}

		return { image: await sharpInstance.png().toBuffer() };
	} catch {
		return { error: { status: 500, message: 'Failed to process network logo' } };
	}
};
