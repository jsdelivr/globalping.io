const ACTIVE_ACCOUNT_COOKIE = 'gp_active_account';

const readActiveAccountId = (userId) => {
	let cookie = document.cookie.split('; ').find(value => value.startsWith(`${ACTIVE_ACCOUNT_COOKIE}=`));
	let [ cookieUserId, accountId ] = (cookie?.slice(ACTIVE_ACCOUNT_COOKIE.length + 1) ?? '').split(':');
	return cookieUserId === userId ? accountId : null;
};

module.exports.getAccountName = (user) => {
	let accountId = readActiveAccountId(user.id);
	let membership = accountId && user.memberships?.find(({ org }) => org.account[0] === accountId);
	return membership ? `${membership.org.name} (${user.github_username})` : user.github_username;
};
