/**
 * Request payload for starting a deployment
 */
export interface IStartDeploymentRequest {
	teamId: string;
	channelId: string;
	repoName: string;
	repoLink: string;
	triggerLink: string;
	triggerTitle: string;
	startTime: string; // ISO-8601 string
	actionLink: string;
	triggerBy: string;
	environment: string; // dev | staging | prod
	emailIds?: string; // Optional comma separated string
	adaptiveCard?: Record<string, unknown>; // Optional custom adaptive card
}

/**
 * Response payload for start deployment
 */
export interface IStartDeploymentResponse {
	threadId: string;
}

/**
 * Request payload for finishing a deployment
 */
export interface IFinishDeploymentRequest {
	teamId: string;
	channelId: string;
	threadId: string;
	repoName: string;
	repoLink: string;
	durationInSeconds: number;
	startTime: string; // ISO-8601 string
	status: 'success' | 'fail';
	triggerBy: string;
	errorMessage?: string;
	logsLink?: string;
	environment: string; // dev | staging | prod
	emailIds?: string; // Optional comma separated string
	adaptiveCard?: Record<string, unknown>; // Optional custom adaptive card
}

export interface IDeployStartEmailPayload {
	repoName: string;
	repoLink: string;
	triggerLink: string;
	triggerTitle: string;
	startTimeIst: string;
	actionLink: string;
	triggerBy: string;
	environment: string;
}

export interface IDeployFinishEmailPayload {
	repoName: string;
	repoLink: string;
	environment: string;
	status: string;
	statusUpper: string;
	statusVerb: string;
	triggerBy: string;
	durationInSeconds: string;
	durationHuman: string;
	startTimeIst: string;
	errorMessage: string;
	logsLink?: string;
	ifError: string;
}

/**
 * Teams conversation reference information
 */
export interface ITeamsConversationReference {
	serviceUrl: string;
	conversationId: string;
	tenantId?: string;
}
