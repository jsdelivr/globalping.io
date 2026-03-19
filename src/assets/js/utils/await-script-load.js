const awaitScriptLoad = (initApp) => {
	let reqPlugins = Array.from(document.querySelectorAll('.prerequisite-script'));
	let pluginsReady = false;

	let pluginPromises = reqPlugins.map((plugin) => {
		return new Promise((resolve) => {
			if (plugin.loaded) {
				resolve(plugin);
				return;
			}

			plugin.addEventListener('load', () => resolve(plugin), { once: true });
			plugin.addEventListener('error', () => resolve(plugin), { once: true });
		});
	});

	Promise.all(pluginPromises).then(() => {
		pluginsReady = true;
		tryInitApp();
	});

	Promise.all([
		import('ractive'),
		// eslint-disable-next-line n/no-missing-import
		import('https://cdn.jsdelivr.net/npm/ractive-route@0.3.13/ractive-route.min.mjs'),
	]).then(([{ default: Ractive }, { Router }]) => {
		Ractive.Router = Router;
		global.Ractive = Ractive;
		tryInitApp();
	});

	let tryInitApp = () => {
		if (typeof Ractive !== 'undefined' && pluginsReady) {
			initApp();
		}
	};
};

module.exports = awaitScriptLoad;
