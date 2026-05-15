const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { parse } = require('csv-parse/sync');

const expandIPv6 = (ip) => {
	if (ip.includes('.')) {
		let lastColon = ip.lastIndexOf(':');

		if (lastColon === -1) {
			return null;
		}

		let ipv4Part = ip.slice(lastColon + 1);
		let octets = ipv4Part.split('.');

		if (octets.length !== 4) {
			return null;
		}

		let bytes = octets.map(part => Number(part));

		if (bytes.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
			return null;
		}

		let high = (bytes[0] * 256 + bytes[1]).toString(16);
		let low = (bytes[2] * 256 + bytes[3]).toString(16);
		ip = `${ip.slice(0, lastColon)}:${high}:${low}`;
	}

	let [ left, right ] = ip.split('::');
	let leftParts = left ? left.split(':').filter(Boolean) : [];
	let rightParts = right ? right.split(':').filter(Boolean) : [];
	let missing = 8 - (leftParts.length + rightParts.length);

	if (missing < 0) {
		return null;
	}

	return [ ...leftParts, ...new Array(missing).fill('0'), ...rightParts ];
};

const parseIPv4ToBigInt = (ip) => {
	return ip.split('.').map(Number).reduce((acc, part) => (acc * 256n) + BigInt(part), 0n);
};

const parseIPv6ToBigInt = (ip) => {
	let parts = expandIPv6(ip);

	if (!parts || parts.length !== 8) {
		return null;
	}

	return parts.reduce((acc, part) => (acc * 65536n) + BigInt(parseInt(part || '0', 16)), 0n);
};

const parseIpToBigInt = (ip, ipType) => {
	if (ipType === 'ipv4') {
		return parseIPv4ToBigInt(ip);
	}

	return parseIPv6ToBigInt(ip);
};

const parseValueToInterval = (value, ipType) => {
	if (!value) {
		return null;
	}

	let [ network, prefixRaw ] = value.split('/');
	let bits = ipType === 'ipv4' ? 32 : 128;
	let prefix = Number(prefixRaw);

	if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits) {
		return null;
	}

	let address = parseIpToBigInt(network, ipType);

	if (address === null) {
		return null;
	}

	let hostBits = BigInt(bits - prefix);
	let size = 2n ** hostBits;

	// normalize network address to CIDR boundary, then derive [start, end].
	let start = (address / size) * size;
	return [ start, start + size - 1n ];
};

const mergeIntervals = (intervals) => {
	// sort by start, then merge overlapping or adjacent ranges
	intervals.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
	let merged = [];

	for (let [ start, end ] of intervals) {
		let last = merged[merged.length - 1];

		if (!last || start > last[1] + 1n) {
			merged.push([ start, end ]);
			continue;
		}

		if (end > last[1]) {
			last[1] = end;
		}
	}

	return merged;
};

const loadCsv = (filename) => {
	let rawData = fs.readFileSync(path.join(__dirname, `/../../../data/${filename}`));
	let csvData = rawData.toString('utf8');

	return parse(csvData, {
		skip_empty_lines: true,
	});
};

/**
 * Builds an IP address lookup from CSV data by parsing CIDR prefixes into
 * numeric intervals, merging adjacent overlaps, and checking candidates via a binary search.
 */
const createIpLookup = (filename, ipType) => {
	let records = loadCsv(filename);
	let intervals = [];

	for (let row of records) {
		let value = row?.[0]?.trim();

		if (!value || value === 'prefix') {
			continue;
		}

		let interval = parseValueToInterval(value, ipType);

		if (interval) {
			intervals.push(interval);
		}
	}

	let mergedIntervals = mergeIntervals(intervals);

	return {
		check (ip) {
			if (net.isIP(ip) !== (ipType === 'ipv4' ? 4 : 6)) {
				return false;
			}

			let target = parseIpToBigInt(ip, ipType);

			if (target === null) {
				return false;
			}

			let low = 0;
			let high = mergedIntervals.length - 1;

			// binary search over merged [start, end] intervals.
			while (low <= high) {
				let mid = Math.floor((low + high) / 2);
				let [ start, end ] = mergedIntervals[mid];

				if (target < start) {
					high = mid - 1;
				} else if (target > end) {
					low = mid + 1;
				} else {
					return true;
				}
			}

			return false;
		},
	};
};

module.exports.createIpLookup = createIpLookup;
