export default {
	root: {
		class: [
			// Shape
			'rounded-md shadow-lg',

			// Size
			'min-w-[12rem]',
			'p-1',

			// Colors
			'bg-surface-0 dark:bg-dark-700',
			'border border-surface-200 dark:border-dark-400',
		],
	},
	rootList: {
		class: [
			// Spacings and Shape
			'list-none',
			'flex flex-col',
			'm-0 p-0',
			'outline-none',
		],
	},
	item: {
		class: 'text-bluegray-700 dark:text-white relative my-[2px] [&:first-child]:mt-0 [&:last-child]:mb-0',
	},
	itemContent: ({ context }) => ({
		class: [
			// Shape
			'rounded-[4px]',

			// Transitions
			'transition-shadow',
			'duration-200',

			// States
			{
				'hover:bg-surface-100 dark:hover:bg-[rgba(255,255,255,0.03)]': !context.active,
				'hover:bg-highlight-emphasis': context.active,
			},

			// Disabled
			{ 'opacity-60 pointer-events-none cursor-default': context.disabled },
		],
	}),
	itemLink: {
		class: [
			'relative',
			// Flexbox

			'flex',
			'items-center',

			// Spacing
			'py-2.5',
			'px-4',

			// Misc
			'no-underline',
			'overflow-hidden',
			'cursor-pointer',
			'select-none',
		],
	},
	itemIcon: {
		class: [
			// Spacing
			'mr-2',
		],
	},
	itemLabel: {
		class: [ 'leading-none' ],
	},
	submenuIcon: {
		class: [
			// Position
			'ml-auto',
		],
	},
	submenu: {
		class: [
			// Spacing
			'flex flex-col',
			'm-0',
			'p-1',
			'list-none',
			'min-w-[12.5rem]',

			// Shape
			'shadow-none sm:shadow-md',
			'border border-surface-200 dark:border-dark-400',

			// Position
			'static sm:absolute',
			'z-10',

			// Color
			'bg-surface-0 dark:bg-dark-700',
		],
	},
	separator: {
		class: 'border-t border-surface-200 dark:border-dark-400 my-[2px]',
	},
	transition: {
		enterFromClass: 'opacity-0',
		enterActiveClass: 'transition-opacity duration-250',
	},
};
