let popoverDecorator = (node, contentHtml) => {
	if (!contentHtml || typeof $(node).popover !== 'function') {
		return { teardown: () => {} };
	}

	let $node = $(node);

	$node.popover({
		container: 'body',
		html: true,
		content: contentHtml,
		placement: 'auto',
		trigger: 'manual',
		template: `<div class="popover gp-popover" role="dialog" tabindex="-1"><div class="arrow"></div><div class="popover-content"></div></div>`,
	});

	let nodeClickHandler = (e) => {
		e.preventDefault();
		$node.popover('toggle');
	};

	let keydownHandler = (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			$node.popover('toggle');
		}
	};

	let shownHandler = () => {
		$(document).on('click.gpPopover', documentClickHandler);
		let popoverId = $node.attr('aria-describedby');

		if (!popoverId) {
			return;
		}

		let $popover = $('#' + popoverId);
		let $focusable = $popover.find('button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])');

		if ($focusable.length) {
			$focusable.first().focus();
		} else {
			$popover.focus();
		}

		$popover.on('keydown.gpPopover', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				$node.popover('hide');
				$node.focus();
			}
		});
	};

	let hiddenHandler = () => {
		$(document).off('click.gpPopover', documentClickHandler);
		let popoverId = $node.attr('aria-describedby');

		if (popoverId) {
			$('#' + popoverId).off('keydown.gpPopover');
		}
	};

	let documentClickHandler = (e) => {
		let popoverId = $node.attr('aria-describedby');

		if (!popoverId) { return; }

		let $popover = $('#' + popoverId);

		// check if the click is outside the trigger and outside this specific popover instance
		if (!$node.is(e.target) && $node.has(e.target).length === 0 && !$popover.is(e.target) && $popover.has(e.target).length === 0) {
			$node.popover('hide');
		}
	};

	$node.on('click', nodeClickHandler);
	$node.on('keydown', keydownHandler);
	$node.on('shown.bs.popover', shownHandler);
	$node.on('hidden.bs.popover', hiddenHandler);

	return {
		update (newContentHtml) {
			let popover = $(node).data('bs.popover');

			if (popover && popover.options) {
				popover.options.content = newContentHtml;
			}
		},
		teardown () {
			let popoverId = $node.attr('aria-describedby');

			$node.off('click', nodeClickHandler);
			$node.off('keydown', keydownHandler);
			$node.off('shown.bs.popover', shownHandler);
			$node.off('hidden.bs.popover', hiddenHandler);
			$(document).off('click.gpPopover', documentClickHandler);

			if (typeof $node.popover === 'function') {
				$node.popover('destroy');
			}

			if (popoverId) {
				$('#' + popoverId).remove();
			}

			$node.removeData('bs.popover');
			$node.removeAttr('aria-describedby');
		},
	};
};

module.exports = popoverDecorator;
