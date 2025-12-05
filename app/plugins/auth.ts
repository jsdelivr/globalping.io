export default defineNuxtPlugin(async () => {
	const auth = useAuth();

	useAsyncData('auth-user-init', () => auth.fetchUser(), {
		server: false,
	});
});
