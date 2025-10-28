require('./polyfills');

const _ = require('./_');
const cDocsGP = require('../../views/pages/docs/api.globalping.io.html');
const cDocsGPAuth = require('../../views/pages/docs/auth.globalping.io.html');

Ractive.DEBUG = location.hostname === 'localhost';

let app = {
	config: {},
};

app.router = new Ractive.Router({
	el: '#page',
	data () {
		return {
			app,
		};
	},
});

let routerDispatch = Ractive.Router.prototype.dispatch;

Ractive.Router.prototype.dispatch = function (...args) {
	routerDispatch.apply(this, args);

	if (!app.router.route.view) {
		return;
	}

	return this;
};

app.router.addRoute('/docs/api.globalping.io', cDocsGP);
app.router.addRoute('/docs/auth.globalping.io', cDocsGPAuth);

_.onDocumentReady(() => {
	let state = {};
	let ractive = new Ractive();
	ractive.set('@shared.app', app);
	ractive.set('@shared.escape', escape);

	function escape (string) {
		string
			.replace(/</g, '\\u003c')
			.replace(/>/g, '\\u003e')
			.replace(/\u2028/g, '\\u2028')
			.replace(/\u2029/g, '\\u2029');
	}

	try {
		let shared = JSON.parse(document.querySelector('#ractive-shared').innerHTML.trim());

		if (shared) {
			Object.keys(shared).forEach((key) => {
				ractive.set(`@shared.${key}`, shared[key]);
			});
		}
	} catch {}

	try {
		state = JSON.parse(document.querySelector('#ractive-data').innerHTML.trim());
	} catch {}

	app.router.init({ noScroll: true, state });

	// open navbar dropdowns on hover
	$(document)
		.on('mouseenter', '.navbar .dropdown', e => setTimeout(() => $(e.target).closest('.navbar-collapse').css('position') !== 'absolute' && $(e.target).closest('.dropdown:not(.open)').find('.dropdown-toggle').dropdown('toggle')))
		.on('mouseleave', '.navbar .dropdown', e => setTimeout(() => $(e.target).closest('.navbar-collapse').css('position') !== 'absolute' && $(e.target).closest('.dropdown.open').find('.dropdown-toggle').dropdown('toggle')));
});

module.exports = app;
