export default (element: HTMLElement) => {
	const rect = element.getBoundingClientRect();

	return (
		element.checkVisibility()
		&& rect.top >= 0
		&& rect.left >= 0
		&& rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
		&& rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
};
