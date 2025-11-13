export const usePageHead = (pageTitle: string, description?: string) => {
	const fullTitle = `${pageTitle} - Globalping`;
	const desc
		= description
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
