const optimizedHosts = require('../json/optimized-hosts.json');
const screenType = {
	mobile: 480,
	tablet: 768,
	mdDesktop: 992,
	lgDesktop: 1272,
	xlDesktop: 1400,
};
const PROBE_NO_TIMING_VALUE = 'time out';
const PROBE_STATUS_FAILED = 'failed';
const PROBE_STATUS_OFFLINE = 'offline';
const PROBE_STATUS_DNS_ERROR = 'dns-error';
const PROBE_STATUS_HTTP_ERROR = 'http-error';
const PROBE_STATUS_ERROR_COLOR = '#9b51e0';

const COUNTRIES = require('../json/countries.json');

const COUNTRIES_MAP = COUNTRIES.reduce((acc, country) => {
	acc[country.code] = country.name;
	return acc;
}, {});

const COUNTRY_CODE_MAP = COUNTRIES.reduce((acc, country) => {
	acc[country.name] = country.code;
	return acc;
}, {});

module.exports = {
	screenType,
	isTabletScreen () {
		return screen.width > screenType.mobile && screen.width <= screenType.tablet;
	},

	isMobileScreen () {
		return screen.width <= screenType.mobile;
	},

	formatDate (date, format = 'long') {
		if (!date) {
			return '';
		}

		if (typeof date === 'string') {
			date = new Date(date);
		}

		if (format === 'short') {
			return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
		}

		return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
	},

	formatDateTime (date) {
		if (!date) {
			return '';
		}

		if (typeof date === 'string') {
			date = new Date(date);
		}

		return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
	},

	formatNumber (number) {
		return Math.floor(number).toString().replace(/\d(?=(?:\d{3})+$)/g, '$& ');
	},

	makeHTTPRequest (obj) {
		let {
			method = 'GET',
			rawResponse = false,
			body,
			url,
			headers,
			responseHeadersToGet = null,
			withCredentials = false,
		} = obj;

		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			xhr.open(method || 'GET', method === 'GET' && body ? url + this.createQueryString(body) : url);

			if (method === 'POST') {
				xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			}

			if (headers) {
				Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));
			}

			if (withCredentials) {
				xhr.withCredentials = true;
			}

			xhr.onerror = xhr.onload = () => {
				let response = xhr.response;

				if (!rawResponse) {
					try {
						response = JSON.parse(response);
					} catch (e) {
						console.error(e);
					}
				}

				let responseHeaders = responseHeadersToGet ? responseHeadersToGet.reduce((headerValuePairs, headerName) => {
					headerValuePairs[headerName] = xhr.getResponseHeader(headerName);

					return headerValuePairs;
				}, {}) : null;

				if (xhr.status >= 200 && xhr.status < 300) {
					let resolveData;

					if (responseHeaders && Object.keys(responseHeaders).length) {
						resolveData = {
							response,
							responseHeaders,
						};
					} else {
						resolveData = response;
					}

					resolve(resolveData);
				} else {
					let rejectData = {
						...response,
						responseStatusCode: xhr.status,
					};

					if (responseHeaders && Object.keys(responseHeaders).length) {
						rejectData = {
							...rejectData,
							responseHeaders,
						};
					}


					reject(rejectData);
				}
			};

			if (method === 'GET') {
				xhr.send();
			} else if (method === 'POST') {
				xhr.send(JSON.stringify(body));
			}
		});
	},

	createQueryString (params) {
		let keys = Object.keys(params);

		if (!keys.length) {
			return '';
		}

		return '?' + keys.filter(key => params[key]).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
	},

	deepExtend (out = {}, ...rest) {
		for (let i = 0; i < rest.length; i++) {
			let obj = rest[i];

			if (!obj) { continue; }

			for (let key in obj) {
				if (Object.hasOwn(obj, key)) {
					if (typeof obj[key] === 'object' && obj[key] !== null) {
						if (obj[key] instanceof Array) {
							out[key] = obj[key].slice(0);
						} else {
							out[key] = this.deepExtend(out[key], obj[key]);
						}
					} else {
						out[key] = obj[key];
					}
				}
			}
		}

		return out;
	},

	onDocumentReady (fn) {
		if (document.readyState !== 'loading') {
			fn();
		} else {
			document.addEventListener('DOMContentLoaded', fn);
		}
	},

	optimizeSrc (url, github) {
		let { newHost, hosts } = optimizedHosts;
		let base = github
			? `https://cdn.jsdelivr.net/gh/${github.user}/${github.project}@${github.head}/`
			: typeof location !== 'undefined'
				? location.href
				: undefined;

		let parsed = new URL(url.replace(/^\/+/, ''), base);

		if (hosts.includes(parsed.hostname)) {
			parsed.pathname = parsed.hostname + parsed.pathname;
			parsed.hostname = newHost;
		}

		return parsed.toString();
	},

	normalizeHref (url, idPrefix) {
		try {
			let parsed = new URL(url.replace(/^\/+/, ''), location.href);

			if (parsed.origin === location.origin && parsed.pathname === location.pathname) {
				if (parsed.hash) {
					parsed.hash = `#${idPrefix}${parsed.hash.substr(1)}`;
				}
			}

			return parsed.toString();
		} catch {
			return url;
		}
	},

	isExternalLink (url) {
		try {
			let parsed = new URL(url.replace(/^\/+/, ''), location.href);

			return parsed.hostname !== location.hostname;
		} catch {
			return false;
		}
	},

	getGpProbeLastTiming (testType, result) {
		let lastTiming;
		let { timings = [] } = result;

		if (testType === 'ping') {
			lastTiming = timings[timings.length - 1] ? timings[timings.length - 1].rtt : PROBE_NO_TIMING_VALUE;
		}

		return lastTiming;
	},

	getGpTargetTiming (targetData) {
		if (!targetData) {
			return null;
		}

		let { avgTiming, isFailed, isOffline, areTimingsReady } = targetData;

		if (isFailed) {
			return PROBE_STATUS_FAILED;
		} else if (isOffline) {
			return PROBE_STATUS_OFFLINE;
		} else if (typeof avgTiming === 'number') {
			return `${Math.round(avgTiming)} ms`;
		} else if (areTimingsReady) {
			return avgTiming;
		}

		return null;
	},

	calcGpTestResTiming (testType, testResData, dnsTraceEnabled = false, units = ' ms') {
		let resTiming;
		let lastTiming;
		let extraValues = {};
		let lowCaseTestName = testType.toLowerCase();
		lastTiming = this.getGpProbeLastTiming(testType, testResData.result);

		if (testResData.result?.status === PROBE_STATUS_FAILED) {
			return {
				value: PROBE_STATUS_FAILED,
				extraValues,
				fullText: PROBE_STATUS_FAILED,
				isFailed: true,
			};
		} else if (testResData.result?.status === PROBE_STATUS_OFFLINE) {
			return {
				value: PROBE_STATUS_OFFLINE,
				extraValues,
				fullText: PROBE_STATUS_OFFLINE,
				isFailed: false,
			};
		}

		if (lowCaseTestName === 'ping') {
			resTiming = testResData.result?.stats?.avg;

			if (typeof testResData.result?.stats?.loss === 'number') {
				extraValues.loss = {
					text: 'Loss',
					value: testResData.result?.stats?.loss,
					units: '%',
				};
			}
		} else if (lowCaseTestName === 'traceroute') {
			let { timings } = testResData.result.hops ? testResData.result.hops[testResData.result.hops.length - 1] : {};

			extraValues.hops = {
				text: 'Hops',
				value: testResData.result.hops?.length ?? 0,
				units: '',
			};

			if (timings && timings.length) {
				let timingsCalc = timings.reduce((res, timing) => {
					if (typeof timing.rtt === 'number') {
						return {
							sum: res.sum + Number(timing.rtt),
							cnt: res.cnt + 1,
						};
					}

					return res;
				}, { sum: 0, cnt: 0 });

				if (timingsCalc.cnt) {
					resTiming = Number((timingsCalc.sum / timingsCalc.cnt).toFixed(3));
				}
			}
		} else if (lowCaseTestName === 'dns') {
			let dnsResult = testResData.result;

			if (dnsTraceEnabled) {
				let lastHop = testResData.result.hops ? testResData.result.hops[testResData.result.hops.length - 1] : {};

				if (lastHop) {
					resTiming = lastHop.timings.total;
					dnsResult = lastHop;
				}
			} else {
				resTiming = testResData.result.timings.total;
			}

			let answersCount = dnsResult.answers?.length ?? 0;
			let dnsStatus = dnsResult.statusCodeName ?? dnsResult.statusCode;

			extraValues.answers = {
				text: 'Answers',
				value: answersCount,
				units: '',
			};

			if (dnsStatus !== null && typeof dnsStatus !== 'undefined') {
				extraValues.dnsStatus = {
					text: dnsResult.statusCodeName ? '' : 'Status',
					value: dnsStatus,
					units: '',
				};
			}

			if ((typeof dnsStatus !== 'undefined' && dnsStatus !== 'NOERROR') || answersCount === 0) {
				extraValues.errorStatus = PROBE_STATUS_DNS_ERROR;
			}
		} else if (lowCaseTestName === 'mtr') {
			let lastHop = testResData.result.hops ? testResData.result.hops[testResData.result.hops.length - 1] : {};

			extraValues.hops = {
				text: 'Hops',
				value: testResData.result.hops?.length ?? 0,
				units: '',
			};

			if (lastHop) {
				resTiming = lastHop.stats.avg;
			}
		} else if (lowCaseTestName === 'http') {
			if (typeof testResData.result.statusCode === 'number') {
				resTiming = testResData.result?.timings?.total;

				extraValues.httpStatus = {
					text: 'HTTP',
					value: testResData.result.statusCode,
					units: '',
				};

				if (testResData.result.statusCode >= 400) {
					extraValues.errorStatus = PROBE_STATUS_HTTP_ERROR;
				}

				if (typeof testResData.result?.timings?.dns === 'number') {
					extraValues.dns = {
						text: 'DNS',
						value: testResData.result.timings.dns,
						units: ' ms',
					};
				}

				if (typeof testResData.result?.timings?.tcp === 'number') {
					extraValues.tcp = {
						text: 'TCP',
						value: testResData.result.timings.tcp,
						units: ' ms',
					};
				}

				if (typeof testResData.result?.timings?.tls === 'number') {
					extraValues.tls = {
						text: 'TLS',
						value: testResData.result.timings.tls,
						units: ' ms',
					};
				}

				if (typeof testResData.result?.timings?.firstByte === 'number') {
					extraValues.firstByte = {
						text: 'TTFB',
						value: testResData.result.timings.firstByte,
						units: ' ms',
					};
				}

				if (typeof testResData.result?.timings?.download === 'number') {
					extraValues.download = {
						text: 'Download',
						value: testResData.result.timings.download,
						units: ' ms',
					};
				}
			}
		}

		if (typeof resTiming === 'number') {
			let note = '';

			switch (lowCaseTestName) {
				case 'traceroute':
				case 'mtr':
					note = '(average)';
					break;
				case 'dns':
				case 'http':
					note = '(total)';
					break;
			}

			return {
				value: resTiming,
				extraValues,
				units,
				note,
				fullText: note ? `${Math.round(resTiming)}${units} ${note}` : `${Math.round(resTiming)}${units}`,
				lastTiming,
			};
		}

		return {
			value: PROBE_NO_TIMING_VALUE,
			extraValues,
			fullText: PROBE_NO_TIMING_VALUE,
			isFailed: testResData.result?.status === PROBE_STATUS_FAILED,
			lastTiming: PROBE_NO_TIMING_VALUE,
		};
	},

	getProbeTimeOutValue () {
		return PROBE_NO_TIMING_VALUE;
	},

	getProbeStatusFailedValue () {
		return PROBE_STATUS_FAILED;
	},

	getProbeStatusOfflineValue () {
		return PROBE_STATUS_OFFLINE;
	},

	getProbeStatusDnsErrorValue () {
		return PROBE_STATUS_DNS_ERROR;
	},

	getProbeStatusHttpErrorValue () {
		return PROBE_STATUS_HTTP_ERROR;
	},

	capitalizeFirstLetter (word) {
		return word ? word[0].toUpperCase() + word.slice(1) : '';
	},

	capitalizeStrEveryFirstLetter (string, exclude = []) {
		return string.split(' ').reduce((res, w) => {
			if (exclude.includes(w)) {
				res.push(w);
			} else {
				res.push(this.capitalizeFirstLetter(w));
			}

			return res;
		}, []).join(' ');
	},

	removeDuplicatedTargets (arr) {
		return arr.reduce((uniquesArr, item) => {
			if (uniquesArr.indexOf(item) < 0) {
				uniquesArr.push(item);
			}

			return uniquesArr;
		}, []);
	},

	extractHttpRawOutput (rawOutput = '') {
		let raw = rawOutput || '';
		let separator = /(?:\r?\n){2}/.exec(raw);

		return {
			rawBody: separator ? raw.slice(separator.index + separator[0].length) : '',
			rawHeaders: separator ? raw.slice(0, separator.index) : raw,
		};
	},

	parseGpRawOutputForTimings (raw) {
		let packets = [];
		let timeMatch, noAnswerMatch;
		let timeRegex = /(?:icmp_seq|tcp_conn)=(\d+).*time=(\d+(\.\d+)?)/;
		let noAnswerRegex = /(?:no answer yet for|No reply from)*(?:icmp_seq|tcp_conn)=(\d+)/;
		let lines = raw.split('\n').filter(l => l);

		for (let i = 0; i < lines.length; i++) {
			if (i === 0) { continue; }

			if (lines[i].includes('---')) { break; }

			timeMatch = timeRegex.exec(lines[i]);
			noAnswerMatch = noAnswerRegex.exec(lines[i]);

			if (timeMatch) {
				packets[timeMatch[1] - 1] = parseFloat(timeMatch[2]);
			} else if (noAnswerMatch) {
				if (!packets[noAnswerMatch[1] - 1]) {
					packets[noAnswerMatch[1] - 1] = PROBE_NO_TIMING_VALUE;
				}
			} else {
				// unknown line, no-op
			}
		}

		return {
			packetsRtt: packets,
			packetsDrop: packets.filter(p => p === PROBE_NO_TIMING_VALUE).length,
			packetsTotal: packets.length,
		};
	},
	memoize (func) {
		let cache = new Map();

		return function (...args) {
			let key = JSON.stringify(args);

			if (!cache.has(key)) {
				cache.set(key, func.apply(this, args));
			}

			return cache.get(key);
		};
	},
	getGpProbeStatusColor (timing, probesMaxTiming = 200, probesMinTiming = 5) {
		// return default GREY color while probe has no timing yet
		if (typeof timing === 'undefined' || timing === null) { return '#c0c0c0'; }

		// return default color for timed out, failed, or offline probe
		if (
			timing === PROBE_NO_TIMING_VALUE
			|| timing === PROBE_STATUS_FAILED
			|| timing === PROBE_STATUS_OFFLINE
		) {
			return '#17233A';
		}

		if (timing === PROBE_STATUS_DNS_ERROR || timing === PROBE_STATUS_HTTP_ERROR) {
			return PROBE_STATUS_ERROR_COLOR;
		}

		function getColorFromGradient (quotient, start, middle, end) {
			return quotient >= 0.5 ? linear(middle, end, (quotient - 0.5) * 2) : linear(start, middle, quotient * 2);
		}

		function linear (startColor, endColor, quotient) {
			let redColor = byteLinear(startColor[1] + startColor[2], endColor[1] + endColor[2], quotient);
			let greenColor = byteLinear(startColor[3] + startColor[4], endColor[3] + endColor[4], quotient);
			let blueColor = byteLinear(startColor[5] + startColor[6], endColor[5] + endColor[6], quotient);

			return `#${redColor}${greenColor}${blueColor}`;
		}

		function byteLinear (partOne, partTwo, quotient) {
			let color = Math.floor(('0x' + partOne) * (1 - quotient) + ('0x' + partTwo) * quotient);

			return color.toString(16).padStart(2, '0');
		}

		let pureTimingValue = parseInt(timing);

		// '#17d4a7', '#ffb800', '#e64e3d' - colors are used for timings scale on the map
		if (pureTimingValue <= probesMinTiming) {
			return '#17d4a7';
		}

		if (pureTimingValue >= probesMaxTiming) {
			return '#e64e3d';
		}

		return getColorFromGradient(pureTimingValue / probesMaxTiming, '#17d4a7', '#ffb800', '#e64e3d');
	},

	getGpTargetStatusColor (targetStats, testType, isInfiniteModeRes = false) {
		if (targetStats?.extraValues?.errorStatus) {
			return this.getGpProbeStatusColor(targetStats.extraValues.errorStatus);
		}

		let timing = isInfiniteModeRes && !targetStats?.areTimingsReady ? null : targetStats?.avgTiming;

		if (targetStats?.isFailed) {
			timing = PROBE_STATUS_FAILED;
		} else if (targetStats?.isOffline && targetStats.avgTiming === PROBE_NO_TIMING_VALUE) {
			timing = PROBE_STATUS_OFFLINE;
		}

		return this.getGpProbeStatusColor(
			timing,
			testType === 'http' ? 1000 : 200,
		);
	},

	getGpFailureStatusText (failureSource) {
		if (failureSource === 'target') {
			return 'Target error';
		}

		if (failureSource === 'resolver') {
			return 'Resolver error';
		}

		return failureSource === 'internal' ? 'Internal error' : 'Error';
	},

	pluralize (singular, countOrPlural, countOrUndefined) {
		let count = typeof countOrPlural === 'string' ? countOrUndefined : countOrPlural;
		let plural = typeof countOrPlural === 'string' ? countOrPlural : singular + 's';

		return count === 1 ? singular : plural;
	},

	createMeasCreditsErrMsg (
		responseHeaders,
		hasToken = false,
		isInfinite = false,
		hasResults = false,
		isSecondTarget = false,
		primaryTarget = '',
	) {
		// do not show err msg if we get a 429 and have results for infinite measurement
		if (hasResults && isInfinite) {
			return null;
		}

		if (hasResults && isSecondTarget && primaryTarget) {
			return `Not enough credits to test both targets, showing results for ${primaryTarget} only. You can get higher limits by creating an account.`;
		}

		let minutes = responseHeaders['x-ratelimit-reset'] / 60;
		let timeToReset = minutes < 1 ? '< 1 minute' : `${Math.ceil(minutes)} minutes`;
		let remainingCredits = Number(responseHeaders['x-ratelimit-remaining'] || 0) + Number(responseHeaders['x-credits-remaining'] || 0);
		let requiredCredits = Number(responseHeaders['x-request-cost'] || 0);

		if (isInfinite === false && remainingCredits) {
			let msg = `<span>You only have ${remainingCredits} credits remaining, and ${requiredCredits} were required.</span>`;

			msg += `<span>Try requesting fewer probes or wait ${timeToReset} for the limit to reset.</span>`;

			if (hasToken) {
				msg += '<span>You can get higher limits by sponsoring us or hosting probes</span>';
			} else {
				msg += '<span>You can get higher limits by creating an account. <a href="https://dash.globalping.io">Sign up</a><span>';
			}

			return msg;
		} else if ((isInfinite && !hasResults) || !remainingCredits) {
			let msg = `<span>You have run out of credits for this session.</span>`;

			msg += `<span>You can wait ${timeToReset} for the limit to reset or get higher limits by`;

			if (hasToken) {
				msg += ` sponsoring us or hosting probes.</span>`;
			} else {
				msg += ` creating an account. <a href='https://dash.globalping.io'>Sign up</a></span>`;
			}

			return msg;
		}

		return 'All tests failed. Maybe you specified a non-existing endpoint?';
	},

	parseValidationErrors (errorBody, target = '') {
		let prefix = target ? `${target}: ` : '';

		return Object.keys(errorBody.params || {}).reduce((res, key) => {
			let fieldName = key.split('.')[key.split('.').length - 1];

			if ([ 'locations', 'magic' ].includes(fieldName)) {
				fieldName = 'location';
			}

			res[fieldName] = `${prefix}${this.capitalizeFirstLetter(errorBody.params[key].replace(/".*"/, fieldName))}`;

			return res;
		}, {});
	},

	sortGpMeasurementResults (results, by, order, targetIdx) {
		let sortCoeff = order === 'desc' ? -1 : 1;

		let sortToFieldMap = {
			'avg': 'avgTiming',
			'max': 'maxTiming',
			'min': 'minTiming',
			'rtt-last': 'lastTiming',
		};

		let getLocationStr = (loc) => {
			return `${loc.city}${loc.country}${loc.continent}${loc.network}`;
		};

		let normalizeSortValue = (value) => {
			if (typeof value === 'number' && !Number.isNaN(value)) {
				return value;
			}

			if (typeof value === 'string' && value) {
				return value.toLowerCase();
			}

			return undefined;
		};

		let compareValues = (a, b, collator) => {
			let lhs = normalizeSortValue(a);
			let rhs = normalizeSortValue(b);

			if (typeof lhs === 'undefined' || typeof rhs === 'undefined') {
				if (lhs === rhs) { return 0; }

				return typeof lhs === 'undefined' ? 1 : -1;
			}

			if (typeof lhs === 'string' || typeof rhs === 'string') {
				return sortCoeff * collator.compare(String(lhs), String(rhs));
			}

			return sortCoeff * (lhs - rhs);
		};

		let getFieldVal = (loc, field) => {
			let value = loc.statsPerTarget[targetIdx]?.[field];

			if (typeof value !== 'number' || Number.isNaN(value)) {
				return Infinity;
			}

			return value;
		};

		let getSortVal = loc => loc.statsPerTarget[targetIdx]?.sortValues?.[by];

		switch (by) {
			case 'location': {
				let collator = new Intl.Collator();

				return results.toSorted((a, b) => sortCoeff * collator.compare(getLocationStr(a), getLocationStr(b)));
			}

			case 'quality': {
				return results.toSorted((a, b) => {
					let totalLhs = getFieldVal(a, 'statsTotal');
					let totalRhs = getFieldVal(b, 'statsTotal');

					if (totalLhs === 0 || totalRhs === 0) {
						return 0;
					}

					return -sortCoeff * (getFieldVal(a, 'statsDrop') / totalLhs - getFieldVal(b, 'statsDrop') / totalRhs);
				});
			}

			default: {
				if (results.some(result => Object.hasOwn(result.statsPerTarget[targetIdx]?.sortValues || {}, by))) {
					let collator = new Intl.Collator(undefined, { numeric: true });

					return results.toSorted((a, b) => compareValues(getSortVal(a), getSortVal(b), collator));
				}

				if (!Object.hasOwn(sortToFieldMap, by)) {
					return results;
				}

				return results.toSorted((a, b) => sortCoeff * (getFieldVal(a, sortToFieldMap[by]) - getFieldVal(b, sortToFieldMap[by])));
			}
		}
	},

	isTagCloudRegion (tag) {
		return /^(gcp|aws|azure|oci)-\S+/.test(tag);
	},

	injectGlobalStyle (href) {
		if (typeof document === 'undefined') {
			return;
		}

		for (let link of document.getElementsByTagName('link')) {
			if (link.href === href) {
				return;
			}
		}

		let link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;
		document.head.appendChild(link);
	},

	networkNameToKey (network) {
		return network.replace(/\./g, '').replace(/[\W]|_/g, ' ').replace(/\s\s+|_/g, ' ').trim().split(' ').join('-').toLowerCase();
	},

	clamp (num, min, max) {
		return Math.min(Math.max(num, min), max);
	},

	createLocationString (newLocation, locationFilter) {
		let targetLoc;
		let locations = locationFilter.replace(/^world$/i, '').split(',').map(location => location.trim()).filter(Boolean);

		if (!locations.length) {
			targetLoc = newLocation;
		} else {
			targetLoc = locations.reduce((shortestLoc, location) => {
				let filteredParts = location.split(/[+%]/).map(part => part.trim()).filter((part) => {
					let countryCode = COUNTRIES_MAP[part];
					let countryName = COUNTRY_CODE_MAP[part];

					let isRedundant = newLocation.includes(part)
						|| (countryCode && newLocation.includes(countryCode))
						|| (countryName && newLocation.includes(countryName));

					return !isRedundant;
				});

				let candidateLoc = [ newLocation, ...filteredParts ].join('+');

				return !shortestLoc || candidateLoc.length < shortestLoc.length
					? candidateLoc
					: shortestLoc;
			}, '');
		}

		return targetLoc;
	},

	escapeLocationString (location) {
		return location.replace(/[%&<>"']/g, ch => ({
			'%': '+',
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			'\'': '&#39;',
		}[ch]));
	},

	numericalFieldWidth (value, minWidth = 1) {
		let optimalWidth = Math.floor(Math.log10(Math.abs(value))) + (value < 0 ? 1 : 0) + 1;
		return Math.max(optimalWidth, minWidth);
	},

	isTouchDevice () {
		return !!window?.matchMedia('(hover: none), (pointer: coarse)')?.matches;
	},

	shouldCollapseResponseBody (body, charsPerLine) {
		if (!body) {
			return false;
		}

		let lines = String(body).split('\n');

		if (lines.length > 3) {
			return true;
		}

		return lines.slice(0, 3).reduce((acc, line) => acc + Math.ceil(line.length / charsPerLine), 0) > 3;
	},

	isEqual (obj1, obj2) {
		if (Object.is(obj1, obj2)) {
			return true;
		}

		if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
			return false;
		}

		let isArray1 = Array.isArray(obj1);
		let isArray2 = Array.isArray(obj2);

		if (isArray1 || isArray2) {
			if (!isArray1 || !isArray2 || obj1.length !== obj2.length) {
				return false;
			}

			for (let i = 0; i < obj1.length; i++) {
				if (!this.isEqual(obj1[i], obj2[i])) {
					return false;
				}
			}

			return true;
		}

		let keys1 = Object.keys(obj1);
		let keys2 = Object.keys(obj2);

		if (keys1.length !== keys2.length) {
			return false;
		}

		for (let key of keys1) {
			if (!Object.hasOwn(obj2, key) || !this.isEqual(obj1[key], obj2[key])) {
				return false;
			}
		}

		return true;
	},
};
