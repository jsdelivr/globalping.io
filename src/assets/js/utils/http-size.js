const _ = require('../_');

// The probe cuts response bodies to this many UTF-16 code units.
const BODY_LENGTH_LIMIT = 10000;
const NO_SIZE = { value: null, text: null };
const TEXT_ENCODER = new TextEncoder();

const parseContentLength = (value) => {
	let trimmed = typeof value === 'string' ? value.trim() : '';

	return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
};

const getContentLength = (headers) => {
	let name = Object.keys(headers || {}).find(key => key.toLowerCase() === 'content-length');
	let value = name ? headers[name] : null;

	if (!Array.isArray(value)) {
		return parseContentLength(value);
	}

	let lengths = value.map(parseContentLength);

	return lengths.length && lengths.every(length => length !== null && length === lengths[0]) ? lengths[0] : null;
};

const getBody = result => _.extractHttpRawOutput(result.rawOutput).rawBody;

// One mode for all targets, like the CLI: Content-Length is the encoded size, so it never mixes with decoded body sizes.
const getHttpSizeMode = (results) => {
	let finishedResults = results.filter(result => result.status === 'finished');

	if (finishedResults.some(result => getContentLength(result.headers) !== null)) {
		return 'content-length';
	}

	return finishedResults.some(result => getBody(result)) ? 'bytes' : 'none';
};

const getHttpSize = (result, mode) => {
	if (result.status !== 'finished') {
		return NO_SIZE;
	}

	if (mode === 'content-length') {
		let value = getContentLength(result.headers);

		return value === null ? NO_SIZE : { value, text: `${value} B` };
	}

	let body = mode === 'bytes' ? getBody(result) : '';

	if (!body) {
		return NO_SIZE;
	}

	let value = TEXT_ENCODER.encode(body).length;
	let isCut = result.truncated && body.length >= BODY_LENGTH_LIMIT;

	return { value, text: `${value}${isCut ? '+' : ''} B` };
};

const getHttpSizeLabel = mode => mode === 'bytes' ? 'Bytes' : 'Content length';

module.exports = { getHttpSize, getHttpSizeLabel, getHttpSizeMode };
