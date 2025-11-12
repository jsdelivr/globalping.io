declare global {
	type User = {
		id: string;
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		external_identifier: string | null; // null for non-gh admin
		github_username: string | null; // null for non-gh admin
		github_organizations: string[];
		user_type: 'member' | 'special' | 'sponsor';
		appearance: null | 'light' | 'dark';
		public_probes: boolean;
		adoption_token: string;
		default_prefix: string;
	};

	type ServerConfig = {
		host: string;
		apiHost: string;
		dashboardHost: string;
		serverHost: string;
		assetsHost: string;
		apiDocsHost: string;
		assetsVersion: string;
	};
}
