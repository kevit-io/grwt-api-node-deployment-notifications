const nodeEnv = process.env.NODE_ENV;
const Config = {
	server: {
		port: process.env.PORT || 3000,
		logLevel: process.env.LOG_LEVEL || 'all',
		alertLogLevel: process.env.ALERT_LOG_LEVEL || 'error',
		env: nodeEnv,
	},
	bot: {
		// Microsoft Bot Framework credentials
		appId: process.env.BOT_APP_ID || '',
		appPassword: process.env.BOT_APP_PASSWORD || '',
		// Teams conversation details (optional - can be auto-captured on bot installation)
		serviceUrl: process.env.TEAMS_SERVICE_URL || '',
		conversationId: process.env.TEAMS_CONVERSATION_ID || '',
		tenantId: process.env.TEAMS_TENANT_ID || '',
	},
	auth: {
		// GitHub Actions OIDC configuration
		githubOidcAudience: process.env.GITHUB_OIDC_AUDIENCE || '',
		// Whitelist by org (any repo in the org is allowed)
		allowedGithubOrgs: process.env.ALLOWED_GITHUB_ORGS || '',
		// Optional: further restrict to specific repos within the org
		allowedGithubRepos: process.env.ALLOWED_GITHUB_REPOS || '',
	},
};
export default Config;
