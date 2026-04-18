const sharp = require('sharp');

const LUMINANCE_THRESHOLD = 230;
const TRIM_TOLERANCE = 10;

/**
 * Extracts and calculates the average RGBA color from the 4 corners of the image.
 */
async function getCornerAverageColor (imageBuffer, width, height) {
	let corners = [
		{ left: 0, top: 0, width: 1, height: 1 },
		{ left: width - 1, top: 0, width: 1, height: 1 },
		{ left: 0, top: height - 1, width: 1, height: 1 },
		{ left: width - 1, top: height - 1, width: 1, height: 1 },
	];

	let r = 0, g = 0, b = 0, a = 0;

	for (let region of corners) {
		let pixelBuffer = await sharp(imageBuffer)
			.extract(region)
			.ensureAlpha()
			.raw()
			.toBuffer();

		r += pixelBuffer[0];
		g += pixelBuffer[1];
		b += pixelBuffer[2];
		a += pixelBuffer[3];
	}

	return {
		r: Math.round(r / 4),
		g: Math.round(g / 4),
		b: Math.round(b / 4),
		alpha: Math.round(a / 4) / 255,
	};
}

/**
 * See https://en.wikipedia.org/wiki/Relative_luminance
 */
const calculateLuminance = (r, g, b) => {
	return (0.299 * r) + (0.587 * g) + (0.114 * b);
};

module.exports.processDomainLogo = async (domain, padding) => {
	let imageUrl = `https://img.jsdelivr.com/img.logo.dev/${domain}?format=png`;

	try {
		let response = await fetch(imageUrl, { headers: { Accept: 'image/png' } });

		if (!response.ok) {
			return { error: { status: response.status, message: response.statusText || 'Failed to fetch upstream image' } };
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

			if (padding) {
				let paddingInt = parseInt(padding);

				if (!isNaN(paddingInt) && paddingInt > 0) {
					// to maintain the aspect ratio during extension, pad proportionally
					sharpInstance = sharpInstance.extend({
						top: paddingInt,
						bottom: paddingInt,
						left: Math.round(paddingInt * aspectRatio),
						right: Math.round(paddingInt * aspectRatio),
						background: bgColor,
					});
				}
			}
		} else if (bgColor.alpha === 0) {
			let paddingInt = parseInt(padding);

			if (!isNaN(paddingInt) && paddingInt > 0) {
				sharpInstance = sharpInstance.extend({
					top: paddingInt,
					bottom: paddingInt,
					left: Math.round(paddingInt * aspectRatio),
					right: Math.round(paddingInt * aspectRatio),
					background: bgColor,
				});
			}
		}

		return { image: await sharpInstance.png().toBuffer() };
	} catch {
		return { error: { status: 500, message: 'Failed to process network logo' } };
	}
};
