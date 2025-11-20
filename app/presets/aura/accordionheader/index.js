export default {
	root: ({ context }) => ({
		class: [
			'flex items-center justify-between text-bluegray-600 dark:text-surface-0 px-6 py-3 font-semibold outline-transparent',
			{
				'focus-visible:outline-offset-2 focus-visible:ring-1 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400': !context.disabled,
			},
		],
	}),
	toggleIcon: 'inline-block text-bluegray-900 dark:text-surface-0 w-4 h-4',
};
