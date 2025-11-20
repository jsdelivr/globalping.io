export default {
	root: ({ props, context, parent }) => ({
		class: [
			'relative',

			// Alignment
			'flex items-center justify-center',
			'py-2.5 px-4',
			'leading-[normal]',
			'rounded-md border',

			...parent.attrs.severity === 'primary'
				? [
					// Color
					'border-r-0 last:border-r dark:border-dark-400',
					{
						'text-main-900': !context.active,
						'text-white bg-primary dark:bg-primary border-primary dark:border-primary': context.active,
					},

					// States
					{
						'hover:bg-surface-50 dark:hover:bg-dark-900': !props.disabled && !props.modelValue,
						'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400': !props.disabled,
					},
				] : [
					// Color
					'bg-surface-100 dark:bg-dark-950',
					{
						'text-surface-600 dark:text-bluegray-200 before:bg-transparent': !context.active,
						'text-surface-800 dark:text-bluegray-50 before:bg-surface-0 dark:before:bg-dark-800': context.active,
					},

					// States
					{
						'hover:text-surface-800 dark:hover:text-bluegray-50': !props.disabled && !props.modelValue,
						'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400': !props.disabled,
					},
				],

			// Invalid State
			{
				'border-red-500 dark:border-red-400': props.invalid,
				'border-surface-100 dark:border-dark-950': !props.invalid && parent.attrs.severity !== 'primary',
			},

			// Before
			{ 'before:absolute before:left-1 before:top-1 before:w-[calc(100%-8px)] before:h-[calc(100%-8px)] before:rounded-[4px] before:z-0': parent.attrs.severity !== 'primary' },

			// Transitions
			'transition-all duration-200',

			// Misc
			{ 'cursor-pointer': !props.disabled, 'opacity-60 select-none pointer-events-none cursor-default': props.disabled },
			'font-bold',
		],
	}),
	content: 'relative items-center inline-flex justify-center gap-2',
	label: ({ props }) => ({
		class: [
			'leading-[normal] text-center w-full z-10 relative',
			'font-bold',
			{ hidden: (!props.modelValue && !props.offLabel) || (props.modelValue && !props.onLabel) },
		],
	}),
	icon: 'relative z-10',
};
