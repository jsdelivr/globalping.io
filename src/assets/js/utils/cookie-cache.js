function getCookie (name) {
	let match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`))?.split('=')[1];
	return match ? JSON.parse(decodeURIComponent(match)) : null;
}

function setCookie (name, value) {
	document.cookie = `${name}=${encodeURIComponent(value)};`;
}

module.exports.withCookieCache = (key, getDefaultValue, revalidate = true) => {
	let value;

	try {
		value = getCookie(key);
	} catch {}

	if (value) {
		if (revalidate) {
			getDefaultValue().then(data => setCookie(key, data)).catch(() => {
				setCookie(key, undefined);
			});
		}

		return Promise.resolve(value);
	}

	return getDefaultValue().then((data) => {
		try {
			setCookie(key, JSON.stringify(data));
		} catch {}

		return data;
	});
};
