const _ = require('../_');
const { getCache } = require('./data-cache');
const apiHost = () => Ractive.sharedGet('apiHost');
const dashboardHost = () => Ractive.sharedGet('dashboardHost');

module.exports.fetchGlobalpingProbes = () => {
	return _.makeHTTPRequest({ url: `${apiHost()}/v1/probes` });
};

module.exports.postGlobalpingMeasurement = (opts, responseHeadersToGet) => {
	let params = {
		method: 'POST',
		url: `${apiHost()}/v1/measurements`,
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
	return _.makeHTTPRequest({ url: `${apiHost()}/v1/measurements/${id}` });
};

module.exports.getGPBlogRss = () => {
	return _.makeHTTPRequest({ url: `https://blog.globalping.io/rss/`, rawResponse: true });
};

const toUser = (user, activeAccount) => user && {
	...user,
	active_account: activeAccount,
	memberships: user.memberships.map(membership => ({ ...membership, org: { ...membership.org, account: membership.org.account[0] } })),
};

module.exports.getGlobalpingUser = (onRevalidate) => {
	return getCache(
		'gp-user',
		1000 * 60 * 60 * 24,
		() => Promise.all([
			_.makeHTTPRequest({
				url: `${dashboardHost()}/users/me`,
				body: { fields: '*,memberships.org.name,memberships.org.account,memberships.org.github_id' },
				withCredentials: true,
			}),
			// The account the session acts as, set on the dashboard.
			_.makeHTTPRequest({ url: `${dashboardHost()}/accounts/active`, withCredentials: true }),
		]).then(([ user, active ]) => toUser(user.data, active.accountId)).catch(() => null),
		true,
		onRevalidate,
	);
};

module.exports.getSponsorshipDetails = (accountId) => {
	return _.makeHTTPRequest({ url: `${dashboardHost()}/sponsorship-details`, withCredentials: true, body: { accountId } });
};

module.exports.gpLogOut = () => {
	return _.makeHTTPRequest({
		method: 'POST',
		url: `${dashboardHost()}/auth/logout`,
		body: { mode: 'session' },
		withCredentials: true,
		rawResponse: true,
	}).then(() => {
		window.sessionStorage.setItem('gp-user', JSON.stringify({ data: null, ttl: Date.now() + 1000 * 60 * 60 * 24 }));
	});
};

module.exports.getDomainFromASN = (asn) => {
	return _.makeHTTPRequest({ url: `/asn-to-domain/${asn}` });
};

module.exports.getNetworkFromIP = (ip) => {
	return _.makeHTTPRequest({ url: `/ip-to-network/${encodeURIComponent(ip)}` });
};

module.exports.getNetworkDomainMap = () => {
	return _.makeHTTPRequest({ url: `/network-to-domain` });
};
