const fs = require('node:fs');
const path = require('node:path');
const maxmind = require('maxmind');

let ipToDomainReader = null;

try {
	let mmdb = fs.readFileSync(path.join(__dirname, '/../../../data/IPINFO_LITE_ASN.mmdb'));
	ipToDomainReader = new maxmind.Reader(mmdb);
} catch {
	console.error('IP to domain MMDB data not downloaded.');
}

module.exports.isReady = () => !!ipToDomainReader;

module.exports.getNetworkByIp = (ip) => {
	let result = ipToDomainReader?.get(ip);
	return { domain: result?.domain || null, name: result?.name || null };
};
