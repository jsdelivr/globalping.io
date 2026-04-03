const { isTouchDevice } = require('../_');

let tooltipDecorator = (
	node,
	content,
	position = 'top',
	rawHtml = false,
	elementName = 'div',
	className,
	offsetX,
	offsetY,
) => {
	let tooltip, handlers, eventName;

	let createTooltip = () => {
		if (document.querySelector('#ractive-tooltip-instance') !== null) {
			return;
		}

		tooltip = document.createElement(elementName);
		tooltip.className = `ractive-tooltip ${getPositionClass(position)}${className ? ` ${className}` : ''}`;

		if (rawHtml) {
			let preTag = document.createElement('pre');
			tooltip.classList.add('raw');

			preTag.textContent = content;
			tooltip.appendChild(preTag);
		} else {
			if (!Array.isArray(content)) {
				tooltip.textContent = content;
			} else {
				content.forEach((line) => {
					tooltip.appendChild(document.createTextNode(line));
					tooltip.appendChild(document.createElement('br'));
				});
			}
		}

		tooltip.id = 'ractive-tooltip-instance';
		document.body.appendChild(tooltip);
	};
	let positionTooltip = () => {
		if (!tooltip) {
			return;
		}

		tooltip.style.left = `${offsetX ? offsetX : getXPos(position)}px`;
		tooltip.style.top = `${offsetY ? offsetY : getYPos(position)}px`;
	};
	let removeTooltip = () => {
		let tooltipInstance = document.querySelector('#ractive-tooltip-instance');

		if (!tooltipInstance) {
			return;
		}

		tooltipInstance.parentElement.removeChild(tooltipInstance);
		tooltip = null;
	};
	let getPositionClass = (position) => {
		let resClass;

		switch (position) {
			case 'top':
				resClass = 'ractive-tooltip-top';
				break;
			case 'left':
				resClass = 'ractive-tooltip-left';
				break;
			case 'right':
				resClass = 'ractive-tooltip-right';
				break;
			default:
				resClass = 'ractive-tooltip-bottom';
		}

		return resClass;
	};
	let getYPos = (position) => {
		let yPos;
		let { top, bottom } = node.getBoundingClientRect();

		switch (position) {
			case 'top':
				yPos = top - tooltip.clientHeight - 10;
				break;
			case 'left':
			case 'right':
				yPos = (top + bottom) / 2 - tooltip.clientHeight / 2;
				break;
			default:
				yPos = bottom + 10;
		}

		return Math.round(yPos);
	};

	let getXPos = (position) => {
		let xPos;
		let { left, right } = node.getBoundingClientRect();

		switch (position) {
			case 'left':
				xPos = left - tooltip.clientWidth - 10;
				break;
			case 'right':
				xPos = right + 10;
				break;
			default:
				xPos = left + (right - left) / 2 - tooltip.clientWidth / 2;
		}

		return Math.round(xPos);
	};

	handlers = {
		mouseover () {
			createTooltip();
			positionTooltip();
		},
		mousemove () {
			positionTooltip();
		},
		mouseleave () {
			removeTooltip();
		},
		click (e) {
			if (!isTouchDevice()) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();
			removeTooltip();
			createTooltip();
			positionTooltip();
		},
	};

	for (eventName in handlers) {
		if (Object.hasOwn(handlers, eventName)) {
			node.addEventListener(eventName, handlers[eventName], false);
		}
	}

	window.addEventListener('scroll', removeTooltip, true);

	return {
		teardown () {
			for (eventName in handlers) {
				if (Object.hasOwn(handlers, eventName)) {
					node.removeEventListener(eventName, handlers[eventName], false);
				}
			}

			window.removeEventListener('scroll', removeTooltip, true);
			removeTooltip();
		},
	};
};

module.exports = tooltipDecorator;
