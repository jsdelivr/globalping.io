const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { parse } = require('csv-parse/sync');

const parseIPv4ToBigInt = (ip) => {
	return ip.split('.').map(Number).reduce((acc, part) => (acc * 256n) + BigInt(part), 0n);
};

const expandIPv6 = (ip) => {
	if (ip.includes('.')) {
		return null;
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

const cidrToInterval = (value, ipType) => {
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

const parseValueToInterval = (value, ipType) => {
	if (!value) {
		return null;
	}

	if (value.includes('/')) {
		return cidrToInterval(value, ipType);
	}

	if (value.includes('-')) {
		let [ startRaw, endRaw ] = value.split('-').map(part => part.trim());
		let start = parseIpToBigInt(startRaw, ipType);
		let end = parseIpToBigInt(endRaw, ipType);

		if (start === null || end === null) {
			return null;
		}

		return start <= end ? [ start, end ] : [ end, start ];
	}

	let address = parseIpToBigInt(value, ipType);

	if (address === null) {
		return null;
	}

	return [ address, address ];
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
 * Builds an IP address lookup from CSV data by parsing prefixes/ranges into
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
