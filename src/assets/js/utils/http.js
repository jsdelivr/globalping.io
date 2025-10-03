const _ = require('../_');
const API_HOST = 'https://api.globalping.io';
const DASH_HOST = 'https://dash-directus.globalping.io';
const HTTP_CACHE = new Map();

const getWithCache = (url, params = {}, responseHeadersToGet = null) => {
	url += _.createQueryString(params);

	if (HTTP_CACHE.has(url)) {
		return HTTP_CACHE.get(url);
	}

	let request;

	if (responseHeadersToGet) {
		request = _.makeHTTPRequest({ url, responseHeadersToGet });
	} else {
		request = _.makeHTTPRequest({ url });
	}

	HTTP_CACHE.set(url, request);

	return request;
};

module.exports.fetchListStatPeriods = () => {
	return getWithCache(`${API_HOST}/v1/stats/periods`);
};

module.exports.fetchGlobalpingProbes = () => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/probes` });
};

module.exports.postGlobalpingMeasurement = (opts, responseHeadersToGet) => {
	let params = {
		method: 'POST',
		url: `${API_HOST}/v1/measurements`,
		body: opts,
		withCredentials: /(?:^|\.)globalping\.io$/.test(location.hostname),
	};

	if (responseHeadersToGet) {
		params = {
			...params,
			responseHeadersToGet,
		};
	}

	return _.makeHTTPRequest(params);
};

module.exports.getGlobalpingMeasurement = (id) => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/measurements/${id}` });
};

module.exports.getGPBlogRss = () => {
	return _.makeHTTPRequest({ url: `https://blog.globalping.io/rss/`, rawResponse: true });
};

module.exports.getGlobalpingUser = () => {
	// Note: The authentication won't work out of the box on localhost because the cookie is set with SameSite=Strict
	// If you need to test the page as an authenticated user (and don't want to set up a local dash and API),
	// just set the production cookie "dash_session_token" (.globalping.io) to SameSite=None via devtools.
	return _.makeHTTPRequest({ url: `${DASH_HOST}/users/me`, withCredentials: true }).then(body => body.data).catch(() => null);
};

module.exports.getSponsorshipDetails = (userId) => {
	return _.makeHTTPRequest({ url: `${DASH_HOST}/sponsorship-details`, withCredentials: true, body: { userId } });
};

module.exports.gpLogOut = () => {
	return _.makeHTTPRequest({
		method: 'POST',
		url: `${DASH_HOST}/auth/logout`,
		body: { mode: 'session' },
		withCredentials: true,
		rawResponse: true,
	});
};

module.exports.getDomainFromASN = (asn) => {
	return _.makeHTTPRequest({ url: `/asn-to-domain/${asn}` });
};
