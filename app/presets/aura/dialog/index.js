export default {
	root: ({ props, state }) => ({
		class: [
			// Shape
			'rounded-lg',
			'shadow-lg',
			'border-0',

			// Size
			props.position === 'top' ? 'max-h[calc(95vh-7*16px)]' : 'max-h-[90vh]',
			{ 'my-28': props.position === 'top' },
			'max-w-[min(900px,95vw)]',
			'w-[50vw]',
			'm-0',

			// Color
			'bg-surface-0 dark:bg-dark-700',
			'[&:last-child]:border-b',
			'border-surface-200 dark:border-dark-400',

			// Transitions
			'transform',
			'scale-100',

			// Maximized State
			{
				'transition-none': state.maximized,
				'transform-none': state.maximized,
				'!w-screen': state.maximized,
				'!h-screen': state.maximized,
				'!max-h-full': state.maximized,
				'!top-0': state.maximized,
				'!left-0': state.maximized,
			},
		],
	}),
	header: {
		class: [
			// Flexbox and Alignment
			'flex items-center justify-between',
			'shrink-0',

			// Spacing
			'p-6',

			// Shape
			'rounded-tl-lg',
			'rounded-tr-lg',

			// Colors
			'text-main-900',
			'border border-b-0',
			'border-surface-200 dark:border-dark-400',
		],
	},
	title: {
		class: [ 'font-bold text-lg leading-[normal] text-bluegray-800 dark:text-surface-0' ],
	},
	headerActions: {
		class: [ 'flex items-center' ],
	},
	content: ({ state, instance }) => ({
		class: [
			// Spacing
			'px-6',
			'pb-6',
			'pt-0',

			// Shape
			{
				'grow': state.maximized,
				'rounded-bl-lg': !instance.$slots.footer,
				'rounded-br-lg': !instance.$slots.footer,
			},

			// Colors
			'text-main-900',
			'border border-t-0 border-b-0',
			'border-surface-200 dark:border-dark-400',

			// Misc
			'overflow-y-auto',
		],
	}),
	footer: {
		class: [
			// Flexbox and Alignment
			'flex items-center justify-end',
			'shrink-0',
			'text-right',
			'gap-2',

			// Spacing
			'px-6',
			'pb-6',

			// Shape
			'border-t-0',
			'rounded-b-lg',

			// Colors
			'bg-surface-0 dark:bg-dark-700',
			'test-main-900',
			'border border-t-0 border-b-0',
			'border-surface-200 dark:border-dark-400',
		],
	},
	mask: ({ props }) => ({
		class: [
			// Transitions
			'transition-all',
			'duration-300',
			{ 'p-5': !props.position === 'full' },

			// Background and Effects
			{ 'has-[.mask-active]:bg-transparent bg-black/40': props.modal },

			'overflow-y-scroll',
		],
	}),
	transition: ({ props }) => {
		// Use default animation for the "position": "top"
		// return props.position === 'top'
		// eslint-disable-next-line no-constant-condition
		return false
			? {
				enterFromClass: 'opacity-0 scale-75 translate-x-0 -translate-y-full translate-z-0 mask-active',
				enterActiveClass: 'transition-all duration-200 ease-out',
				leaveActiveClass: 'transition-all duration-200 ease-out',
				leaveToClass: 'opacity-0 scale-75 translate-x-0 -translate-y-full translate-z-0 mask-active',
			}
			: props.position === 'bottom'
				? {
					enterFromClass: 'opacity-0 scale-75 translate-y-full mask-active',
					enterActiveClass: 'transition-all duration-200 ease-out',
					leaveActiveClass: 'transition-all duration-200 ease-out',
					leaveToClass: 'opacity-0 scale-75 translate-x-0 translate-y-full translate-z-0 mask-active',
				}
				: props.position === 'left' || props.position === 'topleft' || props.position === 'bottomleft'
					? {
						enterFromClass: 'opacity-0 scale-75 -translate-x-full translate-y-0 translate-z-0 mask-active',
						enterActiveClass: 'transition-all duration-200 ease-out',
						leaveActiveClass: 'transition-all duration-200 ease-out',
						leaveToClass: 'opacity-0 scale-75  -translate-x-full translate-y-0 translate-z-0 mask-active',
					}
					: props.position === 'right' || props.position === 'topright' || props.position === 'bottomright'
						? {
							enterFromClass: 'opacity-0 scale-75 translate-x-full translate-y-0 translate-z-0 mask-active',
							enterActiveClass: 'transition-all duration-200 ease-out',
							leaveActiveClass: 'transition-all duration-200 ease-out',
							leaveToClass: 'opacity-0 scale-75 translate-x-full translate-y-0 translate-z-0 mask-active',
						}
						: {
							enterFromClass: 'opacity-0 scale-75 mask-active',
							enterActiveClass: 'transition-all duration-200 ease-out',
							leaveActiveClass: 'transition-all duration-200 ease-out',
							leaveToClass: 'opacity-0 scale-75 mask-active',
						};
	},
};
