const ACTIVE_ACCOUNT_COOKIE = 'gp_active_account';

const readActiveAccountId = (userId) => {
	let cookie = document.cookie.split('; ').find(value => value.startsWith(`${ACTIVE_ACCOUNT_COOKIE}=`));
	let [ cookieUserId, accountId ] = (cookie?.slice(ACTIVE_ACCOUNT_COOKIE.length + 1) ?? '').split(':');
	return cookieUserId === userId ? accountId : null;
};

module.exports.getAccountName = (user) => {
	for (let accountId of [ readActiveAccountId(user.id), user.default_account ]) {
		if (accountId === user.account) {
			return user.github_username;
		}

		let membership = user.memberships.find(({ org }) => org.account === accountId);

		if (membership) {
			return `${membership.org.name} (${user.github_username})`;
		}
	}

	return user.github_username;
};
