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
	let tooltip, handlers, eventName, initialNodeTop, rafId, longPressTimer;

	let handleOutsideClick = (e) => {
		if (tooltip && !node.contains(e.target) && !tooltip.contains(e.target)) {
			removeTooltip();
		}
	};

	let createTooltip = () => {
		if (document.querySelector('#ractive-tooltip-instance') !== null) {
			return;
		}

		initialNodeTop = Math.round(node.getBoundingClientRect().top);

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

		document.addEventListener('click', handleOutsideClick, true);
		document.addEventListener('touchstart', handleOutsideClick, true);

		monitorPosition();
	};

	let monitorPosition = () => {
		if (!tooltip) {
			return;
		}

		let currentTop = Math.round(node.getBoundingClientRect().top);

		if (currentTop !== initialNodeTop) {
			removeTooltip();
			return;
		}

		rafId = requestAnimationFrame(monitorPosition);
	};

	let positionTooltip = () => {
		if (!tooltip) {
			return;
		}

		tooltip.style.left = `${offsetX ? offsetX : getXPos(position)}px`;
		tooltip.style.top = `${offsetY ? offsetY : getYPos(position)}px`;
	};

	let removeTooltip = () => {
		if (typeof rafId === 'number') {
			cancelAnimationFrame(rafId);
			rafId = null;
		}

		clearTimeout(longPressTimer);

		document.removeEventListener('click', handleOutsideClick, true);
		document.removeEventListener('touchstart', handleOutsideClick, true);

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
		touchstart () {
			if (!isTouchDevice()) {
				return;
			}

			longPressTimer = setTimeout(() => {
				removeTooltip();
				createTooltip();
				positionTooltip();
			}, 100);
		},
		contextmenu (e) {
			if (!isTouchDevice()) {
				return;
			}

			e.preventDefault();
		},
	};

	for (eventName in handlers) {
		if (Object.hasOwn(handlers, eventName)) {
			node.addEventListener(eventName, handlers[eventName], false);
		}
	}

	return {
		teardown () {
			for (eventName in handlers) {
				if (Object.hasOwn(handlers, eventName)) {
					node.removeEventListener(eventName, handlers[eventName], false);
				}
			}

			clearTimeout(longPressTimer);
			removeTooltip();
		},
	};
};

module.exports = tooltipDecorator;
