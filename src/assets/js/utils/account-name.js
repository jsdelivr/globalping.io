// Keep sample avatars for the Directus development seeds in sync with the dashboard.
const developmentAvatarIds = {
	1234567890: '583231', // john
	1234567892: '1', // turk
	2000000002: '480938', // teammate
	9000000001: '6191378', // admin-org → jsDelivr
	9000000002: '102991324', // member-org → Globalping
	9000000003: '6128107', // viewer-org → Vue.js
	9000000010: '6078720', // unclaimed-org
};

module.exports.getAccountDisplay = (user, hostname) => {
	let activeOrg = user.active_account && user.memberships?.find(({ org }) => org.account === user.active_account)?.org;
	let login = activeOrg?.name || user.github_username;
	let githubId = activeOrg ? activeOrg.github_id : user.external_identifier;
	let avatarSrc = null;

	if (githubId && /^\d+$/.test(githubId)) {
		let avatarId = hostname === 'localhost' ? developmentAvatarIds[githubId] ?? githubId : githubId;
		avatarSrc = `/github-logo/${avatarId}?size=80`;
	}

	return {
		fullName: activeOrg?.name && user.github_username ? `${activeOrg.name} (${user.github_username})` : login || 'Account',
		avatarSrc,
		isOrg: Boolean(activeOrg),
	};
};
