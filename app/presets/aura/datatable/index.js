export default {
	root: ({ props }) => ({
		class: [
			'relative',

			// Flex & Alignment
			{ 'flex flex-col': props.scrollable && props.scrollHeight === 'flex' },

			// Size
			{ 'h-full': props.scrollable && props.scrollHeight === 'flex' },

			'border rounded-2xl overflow-hidden bg-surface-0 dark:bg-dark-800 min-h-[110px]',
		],
	}),
	mask: {
		class: [
			// Position
			'absolute',
			'top-0 left-0',
			'z-20',

			// Flex & Alignment
			'flex items-center justify-center',

			// Size
			'w-full h-full',

			// Color
			'bg-surface-100 dark:bg-dark-800',

			// Transition
			'transition duration-200',
		],
	},
	loadingIcon: {
		class: 'w-8 h-8 animate-spin text-surface-300',
	},
	tableContainer: ({ props }) => ({
		class: [
			{ 'relative': props.scrollable, 'flex flex-col grow': props.scrollable && props.scrollHeight === 'flex' },

			// Size
			{ 'h-full': props.scrollable && props.scrollHeight === 'flex' },

			'px-4',
		],
	}),
	header: ({ props }) => ({
		class: [
			'font-bold',

			// Shape
			props.showGridlines ? 'border-x border-t border-b-0' : 'border-b border-x-0',

			// Spacing
			'px-4 py-3',

			// Color
			'bg-surface-0 dark:bg-dark-800',
			'border-surface-300 dark:border-dark-600',
			'text-bluegray-700 dark:text-surface-0',
		],
	}),
	table: {
		class: 'w-full border-spacing-0 border-collapse',
	},
	thead: ({ context }) => ({
		class: [
			{
				'bg-surface-0 dark:bg-dark-800 top-0 z-40 sticky': context.scrollable,
			},
		],
	}),
	tbody: ({ instance, context }) => ({
		class: [
			{
				'sticky z-20': instance.frozenRow && context.scrollable,
			},
			'bg-surface-0 dark:bg-dark-800',
		],
	}),
	tfoot: ({ context }) => ({
		class: [
			{
				'bg-surface-0 bottom-0 z-0': context.scrollable,
			},
		],
	}),
	footer: {
		class: [
			'font-bold',

			// Shape
			'border-t',

			// Spacing
			'p-4 pt-2',

			// Color
			'bg-surface-0 dark:bg-dark-800',
			'border-surface-300 dark:border-dark-600',
			'dark:text-surface-0',
		],
	},
	column: {
		headerCell: ({ context, props }) => ({
			class: [
				'font-semibold',
				'leading-[normal]',

				// Position
				{ 'sticky z-20 border-b': props.frozen || props.frozen === '' },

				{ relative: context.resizable },

				// Alignment
				'text-left',

				// Shape
				{ 'first:border-l border-y border-r': context?.showGridlines },
				'border-0 border-b border-solid',

				// Spacing
				context?.size === 'small' ? 'py-[0.375rem] px-2' : context?.size === 'large' ? 'py-[0.9375rem] px-5' : 'pt-4 pb-3 px-2',

				// Color
				// (props.sortable === '' || props.sortable) && context.sorted ? 'bg-highlight' : 'bg-surface-0 dark:text-surface-0 dark:bg-dark-800',
				'border-surface-300 dark:border-dark-600 ',

				// States
				{ 'hover:bg-surface-100 dark:hover:bg-dark-700': props.sortable === '' || props.sortable },
				'focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400',

				// Transition
				{ 'transition duration-200': props.sortable === '' || props.sortable },

				// Misc
				{ 'cursor-pointer': props.sortable === '' || props.sortable },
				{
					'overflow-hidden space-nowrap border-y bg-clip-padding': context?.resizable, // Resizable
				},
			],
		}),
		columnHeaderContent: {
			class: 'flex items-center gap-2',
		},
		sort: ({ context }) => ({
			class: [ context.sorted ? 'text-900' : 'text-surface-700', context.sorted ? 'dark:text-900' : 'dark:text-surface-0' ],
		}),
		bodyCell: ({ props, context, state, parent }) => ({
			class: [
				// Font
				'leading-[normal]',

				// Position
				{ 'sticky box-border border-b': parent.instance.frozenRow },
				{ 'sticky box-border border-b z-20': props.frozen || props.frozen === '' },

				// Alignment
				'text-left',

				// Shape
				// 'border-0 border-b border-solid', - moved to row
				{ 'first:border-l border-r border-b': context?.showGridlines },
				{ 'bg-surface-0 dark:bg-dark-800': parent.instance.frozenRow || props.frozen || props.frozen === '' },

				// Spacing
				{ 'py-[0.375rem] px-2': context?.size === 'small' && !state.d_editing },
				{ 'py-[0.9375rem] px-5': context?.size === 'large' && !state.d_editing },
				{ 'py-3 px-2': context?.size !== 'large' && context?.size !== 'small' && !state.d_editing },
				{ 'py-[0.6rem] px-2': state.d_editing },

				// Color
				'border-surface-300 dark:border-dark-600',

				{
					'overflow-hidden whitespace-nowrap border-y bg-clip-padding': parent.instance?.$parentInstance?.$parentInstance?.resizableColumns, // Resizable
				},
			],
		}),
		footerCell: ({ context }) => ({
			class: [
				// Font
				'font-bold',

				// Alignment
				'text-left',

				// Shape
				'border-0 border-b border-solid',
				{ 'border-x border-y': context?.showGridlines },

				// Spacing
				context?.size === 'small' ? 'p-2' : context?.size === 'large' ? 'p-5' : 'p-4',

				// Color
				'border-surface-300 dark:border-dark-600',
				'text-surface-700 dark:text-surface-0',
				'bg-surface-0 dark:bg-dark-800',
			],
		}),
		sortIcon: ({ context }) => ({
			class: [ 'ml-0', context.sorted ? 'text-inherit' : 'text-surface-700 dark:text-surface-0/70' ],
		}),
		columnFilter: {
			class: 'inline-flex items-center ml-auto font-normal',
		},
		filterOverlay: {
			class: [
				'flex flex-col gap-2',

				// Position
				'absolute top-0 left-0',

				// Shape
				'border-0 dark:border',
				'rounded-md',
				'shadow-md',

				// Size
				'min-w-[12.5rem]',

				// Color
				'bg-surface-0 dark:bg-dark-800',
				'text-surface-800 dark:text-surface-0',
				'dark:border-dark-400',
			],
		},
		filterConstraintList: {
			class: 'm-0 p-0 py-3 list-none',
		},
		filterConstraint: ({ context }) => ({
			class: [
				// Font
				'font-normal',
				'leading-none',

				// Position
				'relative',

				// Shape
				'border-0',
				'rounded-none',

				// Spacing
				'm-0',
				'py-3 px-5',

				// Color
				{ 'text-surface-700 dark:text-surface-0': !context?.highlighted },
				{ 'bg-surface-0 dark:bg-dark-800 text-surface-700 dark:text-surface-0': !context?.highlighted },
				{ 'bg-highlight': context?.highlighted },

				// States
				{ 'hover:bg-surface-100 dark:hover:bg-[rgba(255,255,255,0.03)]': !context?.highlighted },
				{ 'hover:text-surface-700 hover:bg-surface-100 dark:hover:text-surface-0 dark:hover:bg-[rgba(255,255,255,0.03)]': !context?.highlighted },
				'focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400',

				// Transitions
				'transition-shadow',
				'duration-200',

				// Misc
				'cursor-pointer',
				'overflow-hidden',
				'whitespace-nowrap',
			],
		}),
		filterOperator: {
			class: [
				// Shape
				'rounded-t-md',

				// Color
				'text-surface-700 dark:text-surface-0',
				'bg-surface-0 dark:bg-dark-700',
				'[&>[data-pc-name=pcfilteroperatordropdown]]:w-full',
			],
		},
		filter: ({ instance }) => ({
			class: [{ 'flex items-center w-full gap-2': instance.display === 'row', 'inline-flex ml-auto': instance.display === 'menu' }],
		}),
		filterRule: 'flex flex-col gap-2',
		filterButtonbar: 'flex items-center justify-between p-0',
		filterAddButtonContainer: '[&>[data-pc-name=pcfilteraddrulebutton]]:w-full',
		rowToggleButton: {
			class: [
				'relative',

				// Flex & Alignment
				'inline-flex items-center justify-center',
				'text-left',

				// Spacing
				'm-0 p-0',

				// Size
				'w-8 h-8',

				// Shape
				'border-0 rounded-full',

				// Color
				'text-surface-500 dark:text-surface-0/70',
				'bg-transparent',
				'focus-visible:outline-none focus-visible:outline-offset-0',
				'focus-visible:ring-1 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400',

				// Transition
				'transition duration-200',

				// Misc
				'overflow-hidden',
				'cursor-pointer select-none',
			],
		},
		columnResizer: {
			class: [
				'block',

				// Position
				'absolute top-0 right-0',

				// Sizing
				'w-2 h-full',

				// Spacing
				'm-0 p-0',

				// Color
				'border border-transparent',

				// Misc
				'cursor-col-resize',
			],
		},
		transition: {
			class: 'p-4 flex flex-col gap-2',
			enterFromClass: 'opacity-0 scale-y-[0.8]',
			enterActiveClass: 'transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]',
			leaveActiveClass: 'transition-opacity duration-100 ease-linear',
			leaveToClass: 'opacity-0',
		},
	},
	bodyRow: ({ context, props }) => {
		const expanded = props?.expandedRows && props?.expandedRows[props?.rowData?.id];

		return {
			class: [
			// Color
				'dark:text-surface-0',
				{ 'bg-surface-50 dark:!bg-dark-700 !cursor-auto': expanded },
				{ 'bg-highlight': context.selected && props.highlightOnSelect },
				{ 'bg-surface-0 dark:bg-dark-800': !context.selected },
				{ 'font-bold bg-surface-0 dark:bg-dark-800 z-20': props.frozenRow },
				{ 'odd:bg-surface-0 odd:text-surface-600 dark:odd:bg-surface-900 even:bg-surface-50 even:text-surface-600 dark:even:bg-surface-800': context.stripedRows },

				// Shape
				'border-b last:border-b-0',

				// State
				{ 'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 ring-inset dark:focus:ring-primary-400': context.selectable },
				{ 'hover:bg-surface-300/20 dark:hover:bg-surface-800/50 hover:text-surface-600': props.selectionMode && !context.selected },

				// Transition
				{ 'transition duration-200': (props.selectionMode && !context.selected) || props.rowHover },

				// Misc
				{ 'cursor-pointer': props.selectionMode },
			],
		};
	},
	rowExpansion: {
		class: 'bg-surface-0 dark:bg-dark-800 dark:text-surface-0',
	},
	rowGroupHeader: {
		class: [ 'sticky z-20', 'bg-surface-0 text-surface-600 dark:text-surface-0/70', 'dark:bg-dark-800' ],
	},
	rowGroupFooter: {
		class: [ 'sticky z-20', 'bg-surface-0 text-surface-600 dark:text-surface-0/70', 'dark:bg-dark-800' ],
	},
	rowToggleButton: {
		class: [
			'relative',

			// Flex & Alignment
			'inline-flex items-center justify-center',
			'text-left',

			// Spacing
			'm-0 p-0',

			// Size
			'w-8 h-8',

			// Shape
			'border-0 rounded-full',

			// Color
			'text-surface-500 dark:text-surface-0/70',
			'bg-transparent',
			'focus-visible:outline-none focus-visible:outline-offset-0',
			'focus-visible:ring-1 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400',

			// Transition
			'transition duration-200',

			// Misc
			'overflow-hidden',
			'cursor-pointer select-none',
		],
	},
	rowToggleIcon: {
		class: 'inline-block w-4 h-4',
	},
	columnResizeIndicator: {
		class: 'absolute hidden w-[2px] z-20 bg-primary',
	},
};
