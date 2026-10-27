module.exports.getAccountName = (user) => {
	let membership = user.memberships.find(({ org }) => org.account === user.active_account);
	return membership ? `${membership.org.name} (${user.github_username})` : user.github_username;
};
