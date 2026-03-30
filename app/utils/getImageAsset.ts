const imageAssets: Record<string, string> = import.meta.glob('~/assets/images/**/*', { eager: true, import: 'default' });

export default (imgPath: string | undefined) => {
	if (!imgPath) {
		return '';
	}

	const normalizedPath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;

	return imageAssets[`/assets/images${normalizedPath}`] || '';
};
