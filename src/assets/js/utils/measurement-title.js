const gpTitles = {
	dns: 'DNS resolve',
	http: 'HTTP',
	mtr: 'MTR to',
	ping: 'Ping',
	traceroute: 'Traceroute to',
};

module.exports = (data) => {
	let firstMeas = data[0];
	let locationCount = firstMeas.locations?.length;
	let locationStr = '';

	if (locationCount) {
		locationStr = 'from ';

		locationStr += firstMeas.locations?.slice(0, 3).map((location) => {
			return Object.values(location).join('+').trim();
		}).join(', ');

		if (locationCount > 3) {
			locationStr += `... (+${locationCount - 3})`;
		}
	}

	let measType = gpTitles[firstMeas.type];

	if (firstMeas.type === 'http') {
		measType += ` ${firstMeas.measurementOptions?.request?.method ?? 'HEAD'}`;
	}

	let targetString = data.map(meas => meas.target).join(', ');

	return `${measType} ${targetString} ${locationStr} - Globalping`;
};
