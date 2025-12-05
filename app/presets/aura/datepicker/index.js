export default {
	root: ({ props }) => ({
		class: [
			// Display and Position
			{
				'flex': props.fluid,
				'inline-flex': !props.fluid,
			},
			'max-w-full',
			'relative',
		],
	}),
	pcInput: ({ props, parent }) => ({
		root: {
			class: [
				// Display
				'flex-auto w-[1%]',

				// Font
				'leading-none',

				// Colors
				' text-bluegray-500 dark:text-surface-200',
				'placeholder:text-surface-400 dark:placeholder:text-surface-500',
				{ 'bg-surface-0 dark:bg-dark-950': !props.disabled },
				'border',
				{ 'border-surface-300 dark:border-dark-400': !props.invalid },

				// Invalid State
				'invalid:focus:ring-red-200',
				'invalid:hover:border-red-500',
				{ 'border-red-500 dark:border-red-400': props.invalid },

				// Spacing
				'm-0 py-2 px-3',

				// Shape
				'appearance-none',
				{ 'rounded-md': !props.showIcon || props.iconDisplay === 'input' },
				{ 'rounded-l-md flex-1 pr-9': props.showIcon && props.iconDisplay !== 'input' },
				{ 'rounded-md flex-1 pr-9': props.showIcon && props.iconDisplay === 'input' },

				// Transitions
				'transition-colors',
				'duration-200',

				// States
				{
					'hover:border-surface-400 dark:hover:border-surface-600': !props.disabled && !props.invalid,
					'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 focus:z-10': !props.disabled,
					'bg-surface-200 dark:bg-dark-700 select-none pointer-events-none cursor-default': props.disabled,
				},

				// Filled State *for FloatLabel
				{ filled: parent.instance?.$name === 'FloatLabel' && props.modelValue !== null },
			],
		},
	}),
	dropdownIcon: {
		class: [ 'absolute top-1/2 -mt-2', ' text-bluegray-500 dark:text-surface-200', 'right-3' ],
	},
	dropdown: {
		class: [
			'relative',

			// Alignments
			'items-center inline-flex text-center align-bottom justify-center',

			// Shape
			'rounded-r-md',

			// Size
			'py-2 px-0',
			'w-10',
			'leading-[normal]',

			// Colors
			'border border-l-0 border-surface-300 dark:border-dark-400',

			// States
			'focus:outline-none focus:outline-offset-0 focus:ring-1',
			'hover:bg-primary-hover hover:border-primary-hover',
			'focus:ring-primary-500 dark:focus:ring-primary-400',
		],
	},
	inputIconContainer: 'absolute cursor-pointer top-1/2 right-3 -mt-3',
	inputIcon: 'inline-block text-base',
	panel: ({ props }) => ({
		class: [
			// Display & Position
			{
				'absolute': !props.inline,
				'inline-block': props.inline,
			},

			// Size
			{ 'w-auto': !props.inline },
			{ 'min-w-[80vw] w-auto': props.touchUI },
			{ 'min-w-full': props.inline },

			// Shape
			'border rounded-lg',
			{
				'shadow-md': !props.inline,
			},

			// Colors
			'bg-[#F9FAFC] dark:bg-dark-700',
			'border-surface-200 dark:border-dark-400',

			// misc
			{ 'overflow-x-auto': props.inline },
		],
	}),
	header: {
		class: [
			// Font
			'font-medium',

			// Flexbox and Alignment
			'flex items-center justify-between',

			// Spacing
			'p-0 p-3 pt-4',
			'm-0',

			// Shape
			'border-b',
			'rounded-t-md',

			// Colors
			'dark:text-white',
			'dark:bg-dark-700',
			'border-surface-200 dark:border-dark-400',
		],
	},
	title: {
		class: [
			// Text
			'leading-7',
			'mx-auto my-0',
		],
	},
	selectMonth: {
		class: [
			// Font
			'text-base leading-[normal]',
			'font-bold',

			// shape
			'rounded-md',

			// Colors
			'dark:text-white',

			// Transitions
			'transition duration-200',

			// Spacing
			'p-1',
			'm-0 mr-2',

			// States
			'hover:text-primary-500 dark:hover:text-primary-400',
			'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 focus:z-10',

			// Misc
			'cursor-pointer',
		],
	},
	selectYear: {
		class: [
			// Font
			'text-base leading-[normal]',
			'font-bold',

			// shape
			'rounded-md',

			// Colors
			'dark:text-white',

			// Transitions
			'transition duration-200',

			// Spacing
			'p-1',
			'm-0 mr-2',

			// States
			'hover:text-primary-500 dark:hover:text-primary-400',
			'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 focus:z-10',

			// Misc
			'cursor-pointer',
		],
	},
	table: {
		class: [
			// Font
			'text-base leading-[normal]',
			// Size & Shape
			'border-collapse',
			'w-full',

			// Spacing
			'm-3',
		],
	},
	tableHeaderCell: {
		class: [
			// Spacing
			'pb-2',

			'font-semibold',
			'border-b',
		],
	},
	weekHeader: {
		class: [ 'leading-5', 'dark:text-white', 'opacity-60 cursor-default' ],
	},
	weekNumber: {
		class: [ 'dark:text-white', 'opacity-60 cursor-default' ],
	},
	weekday: {
		class: [
			// Colors
			'dark:text-white',
			'p-1',
		],
	},
	dayCell: {
		class: [
			// Spacing
			'py-1.5 px-1',
		],
	},
	weekLabelContainer: {
		class: [
			// Flexbox and Alignment
			'flex items-center justify-center',
			'mx-auto',

			// Shape & Size
			'w-8 h-8',
			'rounded-md',
			'border-transparent border',
			'leading-[normal]',

			// Colors
			'opacity-60 cursor-default',
		],
	},
	dayView: 'm-3',
	day: ({ context }) => ({
		class: [
			// Flexbox and Alignment
			'flex items-center justify-center',
			'mx-auto',

			// Shape & Size
			'w-8 h-8',
			'rounded-md',
			'border-transparent border',
			'leading-[normal]',

			// Colors
			{
				'bg-surface-200 dark:bg-dark-800 dark:text-white': context.date.today && !context.selected && !context.disabled,
				'bg-transparent dark:text-white': !context.selected && !context.disabled && !context.date.today,
				'text-surface-0 bg-primary': context.selected && !context.disabled,
			},

			// States
			'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 focus:z-10',
			{
				'hover:bg-surface-100 dark:hover:bg-dark-500': !context.selected && !context.disabled,
			},
			{
				'text-bluegray-300 opacity-60 cursor-default': context.disabled,
				'cursor-pointer': !context.disabled,
			},
		],
	}),
	monthView: {
		class: [
			// Spacing
			'm-2',
		],
	},
	month: ({ context }) => ({
		class: [
			// Flexbox and Alignment
			'inline-flex items-center justify-center',

			// Size
			'w-1/3',
			'p-1',

			// Shape
			'rounded-md',

			// Colors
			{
				'dark:text-white bg-transparent': !context.selected && !context.disabled,
				'text-surface-0 bg-primary': context.selected && !context.disabled,
			},

			// States
			'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 focus:z-10',
			{
				'hover:bg-surface-100 dark:hover:bg-[rgba(255,255,255,0.03)]': !context.selected && !context.disabled,
			},

			// Misc
			{
				'text-bluegray-300 opacity-60 cursor-default': context.disabled,
				'cursor-pointer': !context.disabled,
			},
		],
	}),
	yearView: {
		class: [
			// Spacing
			'm-2',
		],
	},
	year: ({ context }) => ({
		class: [
			// Flexbox and Alignment
			'inline-flex items-center justify-center',

			// Size
			'w-1/2',
			'p-1',

			// Shape
			'rounded-md',

			// Colors
			{
				'dark:text-white bg-transparent': !context.selected && !context.disabled,
				'text-surface-0 bg-primary': context.selected && !context.disabled,
			},

			// States
			'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 focus:z-10',
			{
				'hover:bg-surface-100 dark:hover:bg-[rgba(255,255,255,0.03)]': !context.selected && !context.disabled,
			},

			// Misc
			{
				'text-bluegray-300 opacity-60 cursor-default': context.disabled,
				'cursor-pointer': !context.disabled,
			},
		],
	}),
	timePicker: {
		class: [
			// Flexbox
			'flex',
			'justify-center items-center',

			// Borders
			'border-t-1',
			'border-solid border-surface-200',

			// Spacing
			'pt-2 mt-2',
		],
	},
	separatorContainer: {
		class: [
			// Flexbox and Alignment
			'flex',
			'items-center',
			'flex-col',

			// Spacing
			'px-2',
		],
	},
	separator: {
		class: [
			// Text
			'text-xl',
		],
	},
	hourPicker: {
		class: [
			// Flexbox and Alignment
			'flex',
			'items-center',
			'flex-col',

			// Spacing
			'px-2',
		],
	},
	minutePicker: {
		class: [
			// Flexbox and Alignment
			'flex',
			'items-center',
			'flex-col',

			// Spacing
			'px-2',
		],
	},
	secondPicker: {
		class: [
			// Flexbox and Alignment
			'flex',
			'items-center',
			'flex-col',

			// Spacing
			'px-2',
		],
	},
	ampmPicker: {
		class: [
			// Flexbox and Alignment
			'flex',
			'items-center',
			'flex-col',

			// Spacing
			'px-2',
		],
	},
	calendarContainer: 'flex',
	calendar: 'flex-auto border-l first:border-l-0 border-surface-200',
	buttonbar: {
		class: [
			// Flexbox
			'flex justify-between items-center',

			// Spacing
			'pt-2',

			// Shape
			'border-t border-surface-200 dark:border-dark-400',
		],
	},
	transition: {
		enterFromClass: 'opacity-0 scale-y-[0.8]',
		enterActiveClass: 'transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]',
		leaveActiveClass: 'transition-opacity duration-100 ease-linear',
		leaveToClass: 'opacity-0',
	},
};
