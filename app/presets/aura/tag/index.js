export default {
	root: ({ props }) => ({
		class: [
			// Font
			'text-xs font-bold',

			// Alignments
			'inline-flex items-center justify-center',

			// Spacing
			'px-[0.4rem] py-1',

			// Shape
			{
				'rounded-md': !props.rounded,
				'rounded-full': props.rounded,
			},

			// Colors
			{
				'bg-highlight': props.severity === null || props.severity === 'primary',
				'text-green-500 dark:text-green-300 bg-green-50 dark:bg-green-500/20': props.severity === 'success',
				'border': props.severity === 'secondary',
				'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20': props.severity === 'info',
				'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-500/20': props.severity === 'warn',
				'text-red-500 dark:text-red-300 bg-red-50 dark:bg-red-500/20': props.severity === 'danger',
				'text-surface-0 dark:text-surface-900 bg-surface-900 dark:bg-surface-0': props.severity === 'contrast',
			},
		],
	}),
	value: {
		class: 'leading-normal',
	},
	icon: {
		class: 'mr-1 text-sm',
	},
};
