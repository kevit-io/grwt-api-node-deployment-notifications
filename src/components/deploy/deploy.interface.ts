/**
 * Request payload for starting a deployment
 */
export interface IStartDeploymentRequest {
	teamId: string;
	channelId: string;
	service: string;
	repository: string;
	repositoryUrl: string;
	environment: string;
	version: string;
	pipelineUrl: string;
	commitSha: string;
	triggeredBy: string;
	startTime: string; // ISO-8601 string
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
	service: string;
	repository: string;
	repositoryUrl: string;
	environment: string;
	status: 'success' | 'failure';
	endTime: string; // ISO-8601 string
	durationSeconds: number;
	pipelineUrl: string;
	logsUrl: string;
	errorSummary?: string;
	adaptiveCard?: Record<string, unknown>; // Optional custom adaptive card
}

/**
 * Teams conversation reference information
 */
export interface ITeamsConversationReference {
	serviceUrl: string;
	conversationId: string;
	tenantId?: string;
}
