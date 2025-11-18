type UsePageHeadOpts = ({ title: string } | { prefix: string }) & { description?: string };

export default (opts: UsePageHeadOpts) => {
	const fullTitle = 'title' in opts ? opts.title : `${opts.prefix} - Globalping`;
	const desc = opts.description
		|| 'Run free latency tests and network commands like ping, traceroute, HTTP and DNS resolve on probes located worldwide.';

	useHead({
		title: fullTitle,
		meta: [
			{ name: 'description', content: desc },
			{ property: 'og:title', content: fullTitle },
			{ property: 'og:description', content: desc },
			{ name: 'twitter:title', content: fullTitle },
			{ name: 'twitter:description', content: desc },
		],
	});
};
