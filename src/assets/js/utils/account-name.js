// Keep sample avatars for the Directus development seeds in sync with the dashboard.
const developmentAvatarLogins = {
	'john': 'octocat',
	'turk': 'mojombo',
	'teammate': 'hubot',
	'admin-org': 'jsdelivr',
	'member-org': 'globalping',
	'viewer-org': 'vuejs',
	'unclaimed-org': 'npm',
};

module.exports.getAccountDisplay = (user, hostname) => {
	let activeOrg = user.active_account && user.memberships?.find(({ org }) => org.account === user.active_account)?.org;
	let login = activeOrg?.name || user.github_username;
	let avatarLogin = hostname === 'localhost' ? developmentAvatarLogins[login] ?? login : login;

	return {
		fullName: activeOrg?.name && user.github_username ? `${activeOrg.name} (${user.github_username})` : login || 'Account',
		avatarSrc: login ? `/github-logo/${avatarLogin}?size=80` : null,
		isOrg: Boolean(activeOrg),
	};
};
