export default {
	root: ({ props, state }) => ({
		class: [
			// Display and Position
			'inline-flex',
			'relative',

			// Shape
			'rounded-md',

			// Color and Background
			{ 'bg-surface-0 dark:bg-dark-900': !props.disabled },
			'border outline-none',
			{ 'border-surface-300 dark:border-dark-600': !props.invalid },

			// Invalid State
			'invalid:focus:ring-red-200',
			'invalid:hover:border-red-500',
			{ 'border-red-500 dark:border-red-400': props.invalid },

			// Transitions
			'transition-all',
			'duration-200',

			// States
			{ 'hover:border-surface-400 dark:hover:border-dark-400': !props.invalid },
			{ 'ring-1 ring-primary-500 dark:ring-primary-400 z-10': state.focused },

			// Misc
			'cursor-pointer',
			'select-none',
			{ 'bg-surface-200 dark:bg-dark-900 select-none pointer-events-none cursor-default': props.disabled },
		],
	}),
	labelContainer: {
		class: [ 'overflow-hidden flex flex-auto cursor-pointer' ],
	},
	label: {
		class: [
			'block leading-[normal]',

			// Space
			'py-2 px-3',

			// Color
			'text-bluegray-400',

			// Transition
			'transition duration-200',

			// Misc
			'overflow-hidden whitespace-nowrap cursor-pointer overflow-ellipsis',
		],
	},
	dropdown: {
		class: [
			// Flexbox
			'flex items-center justify-center',
			'shrink-0',

			// Color and Background
			'bg-transparent',
			'text-surface-500',

			// Size
			'w-12',

			// Shape
			'rounded-r-md',
		],
	},
	panel: {
		class: [
			// Colors
			'bg-surface-0 dark:bg-dark-700',
			'text-surface-700 dark:text-white/80',

			// Shape
			'border border-surface-300 dark:border-dark-600',
			'rounded-md',
			'shadow-md',

			// Padding
			'p-1',
		],
	},
	treeContainer: {
		class: [
			// Sizing
			'max-h-[200px]',

			// Misc
			'overflow-auto',
		],
	},
	transition: {
		enterFromClass: 'opacity-0 scale-y-[0.8]',
		enterActiveClass: 'transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]',
		leaveActiveClass: 'transition-opacity duration-100 ease-linear',
		leaveToClass: 'opacity-0',
	},
};
