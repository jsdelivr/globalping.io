module.exports = async (handler, ctx) => {
	// let handler process the request, save res body, headers, and status code via a proxy
	let requestFinished;
	let processingPromise = new Promise((resolve) => {
		requestFinished = resolve;
	});

	let bodyChunks = [];
	let bodyBuffer = Buffer.alloc(0);
	let headers = Object.create(null);
	let capturedStatusCode = 200;

	let resProxy = new Proxy(ctx.res, {
		get (target, property, receiver) {
			// do not send anything to the client
			if ([ 'writeContinue', 'writeEarlyHints', 'flushHeaders' ].includes(property)) {
				return () => null;
			}

			if (property === 'setHeader') {
				return function (name, value) {
					headers[name.toLowerCase()] = value;
				};
			}

			if (property === 'getHeader') {
				return function (name) {
					return headers[name.toLowerCase()];
				};
			}

			if (property === 'removeHeader') {
				return function (name) {
					delete headers[name.toLowerCase()];
				};
			}

			if (property === 'writeHead') {
				return function (statusCode, statusMessage, newHeaders) {
					capturedStatusCode = statusCode;

					if (typeof statusMessage === 'object' && statusMessage !== null) {
						newHeaders = statusMessage;
						statusMessage = null;
					}

					if (newHeaders) {
						Object.entries(newHeaders).forEach(([ key, value ]) => {
							headers[key.toLowerCase()] = value;
						});
					}

					return resProxy;
				};
			}

			if (property === 'write') {
				return function (chunk, encoding, callback) {
					if (typeof encoding === 'function') {
						callback = encoding;
						encoding = null;
					}

					if (typeof chunk === 'string') {
						chunk = Buffer.from(chunk, encoding ?? 'utf8');
					}

					bodyChunks.push(chunk);
					callback?.();

					return true;
				};
			}

			if (property === 'end') {
				return function (chunk, encoding, callback) {
					if (typeof chunk === 'function') {
						callback = chunk;
						chunk = null;
						encoding = null;
					}

					if (typeof encoding === 'function') {
						callback = encoding;
						encoding = null;
					}

					if (chunk) {
						if (typeof chunk === 'string') {
							chunk = Buffer.from(chunk, encoding || 'utf8');
						}

						bodyChunks.push(chunk);
					}

					bodyBuffer = Buffer.concat(bodyChunks);

					callback?.();
					requestFinished();
					return resProxy;
				};
			}

			return Reflect.get(target, property, receiver);
		},

		set (target, property, value, receiver) {
			if (property === 'statusCode') {
				capturedStatusCode = value;
				return true;
			}

			return Reflect.set(target, property, value, receiver);
		},
	});

	let onFailure = (err) => {
		console.error(err);
		capturedStatusCode = 500;
		bodyChunks.length = 0;
		bodyChunks.push(Buffer.from('Internal Server Error'));
		requestFinished();
	};

	// pass req to the handler
	try {
		handler(ctx.req, resProxy)?.catch(onFailure);
	} catch (err) {
		onFailure(err);
	}

	await processingPromise;

	// apply captured handler data
	ctx.status = capturedStatusCode;
	ctx.set(headers);
	ctx.body = bodyBuffer;

	// properties for the remaining middleware
	if (capturedStatusCode < 400) {
		ctx.res.allowCaching = true;
		ctx.maxAge = 5 * 60;
	}
};
