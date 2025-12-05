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

	type Status = 'initializing' | 'ready' | 'unbuffer-missing' | 'ping-test-failed' | 'sigterm' | 'offline';

	type CustomLocation<TCountry extends string = string> = null | {
		country: TCountry;
		city: string;
		state: TCountry extends 'US' ? string : null;
		longitude: number;
		latitude: number;
	};

	type Probe<TCountry extends string = string> = {
		id: string;
		asn: number;
		city: string;
		country: TCountry;
		state: TCountry extends 'US' ? string : null;
		stateName: TCountry extends 'US' ? string : null;
		date_created: string;
		date_updated: string;
		ip: string;
		altIps: string[];
		lastSyncDate: string;
		latitude: number;
		longitude: number;
		name: string | null;
		network: string;
		onlineTimesToday: number;
		status: Status;
		tags: {
			value: string;
			prefix: string;
			format?: string;
		}[];
		systemTags: string[];
		userId: string | null;
		uuid: string;
		version: string;
		hardwareDevice: string | null;
		hardwareDeviceFirmware: string | null;
		nodeVersion: string;
		allowedCountries: string[];
		searchIndex: string;
		isOutdated: boolean;
		customLocation: CustomLocation<TCountry>;
	};
}
