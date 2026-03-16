let popoverDecorator = (node, contentHtml) => {
	if (!contentHtml || typeof $(node).popover !== 'function') {
		return { teardown: () => {} };
	}

	$(node).popover({
		container: 'body',
		html: true,
		content: contentHtml,
		placement: 'auto',
		trigger: 'focus',
		template: `<div class="popover gp-popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>`,
	});

	return {
		update (newContentHtml) {
			let popover = $(node).data('bs.popover');

			if (popover && popover.options) {
				popover.options.content = newContentHtml;
			}
		},
		teardown () {
			let $node = $(node);
			let popoverId = $node.attr('aria-describedby');

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
