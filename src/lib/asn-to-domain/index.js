const fs = require('node:fs');
const path = require('node:path');

let asnToDomain = null;

try {
	asnToDomain = JSON.parse(fs.readFileSync(path.join(__dirname, '/../../../data/asn-domain.json'), 'utf8'));
} catch {
	console.error('ASN to domain name data not downloaded.');
}

module.exports = asnToDomain;
