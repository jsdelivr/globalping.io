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
		await writeTypes(nuxt);

		// create .nuxt
		await build(nuxt);

		// get route handler
		return toNodeListener(nuxt.server.app);
	}

	// in prod, use the built route
	let { useNitroApp } = await import('../../../.output/server/chunks/nitro.mjs');
	let nitroApp = useNitroApp();
	return toNodeListener(nitroApp.h3App);
};
