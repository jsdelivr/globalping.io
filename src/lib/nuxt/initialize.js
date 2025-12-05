const { toNodeListener } = require('h3');

module.exports = async (isDev = process.env.NODE_ENV === 'development') => {
	// nuxt does not support cjs
	let { loadNuxt, build } = await import('nuxt');
	let { writeTypes } = await import('nuxt/kit');

	if (isDev) {
		let nuxt = await loadNuxt({
			ready: true,
			dev: true,
		});

		// create tsconfig
		let p1 = await writeTypes(nuxt);

		// create .nuxt
		let p2 = await build(nuxt);

		await Promise.all([
			p1, p2,
		]);

		// get route handler
		return toNodeListener(nuxt.server.app);
	}

	// in prod, use the built route
	let { useNitroApp } = await import('../../../.output/server/chunks/nitro.mjs');
	let nitroApp = useNitroApp();
	return toNodeListener(nitroApp.h3App);
};
