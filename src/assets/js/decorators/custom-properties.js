module.exports = (node, properties) => {
	let setProperties = newProperties => Object.entries(newProperties).forEach(([ name, value ]) => node.style.setProperty(name, value));

	setProperties(properties);

	return { update: setProperties, teardown: () => {} };
};
