export default {
	root: {
		class: [
			// Flexbox
			'inline-flex items-center',

			// Spacing
			'px-1 py-0.5 gap-2',

			// Shape
			'rounded-md',

			// Colors
			'text-bluegray-900 dark:text-surface-0',
			'border',
		],
	},
	label: {
		class: 'leading-6 m-0',
	},
	icon: {
		class: 'leading-6 mr-2',
	},
	image: {
		class: [ 'w-8 h-8 -ml-2 mr-2', 'rounded-full' ],
	},
	removeIcon: {
		class: [
			'inline-block',
			// Shape
			'rounded-md leading-6',

			// Size
			'w-4 h-3',

			// Transition
			'transition duration-200 ease-in-out',

			// Misc
			'cursor-pointer',
		],
	},
};
