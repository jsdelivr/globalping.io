#!/usr/bin/env node

const got = require('got');
const zlib = require('zlib');
const { parse } = require('csv-parse');
const tar = require('tar-stream');
const fs = require('fs');
const path = require('path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const DATA_DIR = path.resolve(__dirname, '../data');
const ASN_DOMAIN_OUTPUT_PATH = path.join(DATA_DIR, 'asn-domain.json');
const IPINFO_MMDB_OUTPUT_PATH = path.join(DATA_DIR, 'IPINFO_LITE_ASN.mmdb');
const MAXMIND_CITY_MMDB_OUTPUT_PATH = path.join(DATA_DIR, 'MAXMIND_GEO_LITE2_CITY.mmdb');
const ANYCAST_IPV4_OUTPUT_PATH = path.join(DATA_DIR, 'LACES_ANYCAST_IPV4.csv');
const ANYCAST_IPV6_OUTPUT_PATH = path.join(DATA_DIR, 'LACES_ANYCAST_IPV6.csv');
const ASN_COLUMN_INDEX = 2;
const DOMAIN_COLUMN_INDEX = 4;

function ensureDataDir () {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

function writeTextFile (filePath, content) {
	ensureDataDir();
	fs.writeFileSync(filePath, content, 'utf8');
}

async function downloadToFile (url, outputPath, { compressed = false } = {}) {
	ensureDataDir();
	let source = got.stream(url, compressed ? { decompress: false } : {});

	await pipeline(source, fs.createWriteStream(outputPath));
	console.log(`Saved: ${outputPath}`);
}

async function fetchAndSaveAsnDomainMap (sourceUrl) {
	let asnDomainMap = Object.create(null);
	let hasRecords = false;
	let parser = parse({
		from_line: 2,
		skip_empty_lines: true,
	});

	let parsePromise = pipeline(
		got.stream(`${sourceUrl}.csv.gz`, { decompress: false }),
		zlib.createGunzip(),
		parser,
	);

	for await (let row of parser) {
		hasRecords = true;
		let asn = row[ASN_COLUMN_INDEX];
		let domain = row[DOMAIN_COLUMN_INDEX];

		if (asn && domain) {
			asnDomainMap[asn] = domain;
		}
	}

	if (!hasRecords) {
		throw new Error('No data found in ipinfo-lite CSV file');
	}

	await parsePromise;

	writeTextFile(ASN_DOMAIN_OUTPUT_PATH, `${JSON.stringify(asnDomainMap, null, '\t')}\n`);
	console.log(`ASN-domain map saved: ${ASN_DOMAIN_OUTPUT_PATH}`);
}

function shouldIncludeAnycastPrefix (row) {
	if (!row?.[0]) {
		return false;
	}

	let prefix = row[0].trim().toLowerCase();

	if (!prefix || prefix === 'prefix') {
		return false;
	}

	let maxAB = Math.max(
		Number.parseFloat(row[1]) || 0,
		Number.parseFloat(row[2]) || 0,
		Number.parseFloat(row[3]) || 0,
	);

	let maxGCD = Math.max(
		Number.parseFloat(row[4]) || 0,
		Number.parseFloat(row[5]) || 0,
	);

	// As per https://manycast.net/ recommendation.
	return maxAB > 3 || maxGCD > 1;
}

async function downloadAndFilterAnycastPrefixes (sourceUrl, outputPath) {
	let response = await got(sourceUrl, {
		decompress: false,
		responseType: 'buffer',
	});
	let isGzip = response.body?.[0] === 0x1f && response.body?.[1] === 0x8b;
	let parser = parse({
		skip_empty_lines: true,
	});
	let inputStream = Readable.from(response.body);
	let parsePromise = isGzip
		? pipeline(inputStream, zlib.createGunzip(), parser)
		: pipeline(inputStream, parser);
	let prefixes = [ 'prefix' ];

	for await (let row of parser) {
		if (!shouldIncludeAnycastPrefix(row)) {
			continue;
		}

		prefixes.push(row[0].trim());
	}

	await parsePromise;
	writeTextFile(outputPath, `${prefixes.join('\n')}\n`);
	console.log(`Filtered anycast prefixes saved: ${outputPath}`);
}

async function extractFileFromTarGz (sourceUrl, targetFileName) {
	let extract = tar.extract();
	let extractedFileBuffer = null;

	extract.on('entry', (header, stream, next) => {
		let entryName = header?.name || '';
		let isTarget = entryName === targetFileName || entryName.endsWith(`/${targetFileName}`);

		if (!isTarget || extractedFileBuffer) {
			stream.resume();
			stream.on('end', next);
			return;
		}

		let chunks = [];
		stream.on('data', chunk => chunks.push(chunk));

		stream.on('end', () => {
			extractedFileBuffer = Buffer.concat(chunks);
			next();
		});

		stream.on('error', next);
	});

	await pipeline(
		got.stream(sourceUrl, { decompress: false }),
		zlib.createGunzip(),
		extract,
	);

	if (!extractedFileBuffer || extractedFileBuffer.length === 0) {
		throw new Error(`${targetFileName} not found in archive.`);
	}

	return extractedFileBuffer;
}

async function downloadAndExtractCityDatabase (sourceUrl, outputPath) {
	let cityMmdbBuffer = await extractFileFromTarGz(sourceUrl, 'GeoLite2-City.mmdb');

	ensureDataDir();
	fs.writeFileSync(outputPath, cityMmdbBuffer);
	console.log(`Extracted city MMDB saved: ${outputPath}`);
}

async function main () {
	let ipInfoBaseUrl = 'https://download.jsdelivr.com/IPINFO_LITE_ASN';
	let cityDatabaseArchiveUrl = 'https://download.jsdelivr.com/MAXMIND_GEO_LITE2_CITY.mmdb.tar.gz';
	let anycastIpv4SourceUrl = 'https://download.jsdelivr.com/LACES_ANYCAST_IPV4.csv.gz';
	let anycastIpv6SourceUrl = 'https://download.jsdelivr.com/LACES_ANYCAST_IPV6.csv.gz';

	try {
		await fetchAndSaveAsnDomainMap(ipInfoBaseUrl);
		await downloadToFile(`${ipInfoBaseUrl}.mmdb`, IPINFO_MMDB_OUTPUT_PATH);
		await downloadAndExtractCityDatabase(cityDatabaseArchiveUrl, MAXMIND_CITY_MMDB_OUTPUT_PATH);
		await downloadAndFilterAnycastPrefixes(anycastIpv4SourceUrl, ANYCAST_IPV4_OUTPUT_PATH);
		await downloadAndFilterAnycastPrefixes(anycastIpv6SourceUrl, ANYCAST_IPV6_OUTPUT_PATH);
	} catch (err) {
		console.error('Failed to fetch or process data:', err);
		process.exit(1);
	}
}

main().catch(console.error);
