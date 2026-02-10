import { Attachment } from 'botbuilder';
import {
	IStartDeploymentRequest,
	IFinishDeploymentRequest,
} from './deploy.interface';

/**
 * Adaptive Card builder for deployment notifications
 */
export class AdaptiveCardBuilder {
	/**
	 * Creates an Adaptive Card for deployment start notification
	 * If custom adaptiveCard is provided in the request, it will be used instead
	 */
	static createStartDeploymentCard(
		deploymentData: IStartDeploymentRequest,
	): Attachment {
		// If custom adaptive card is provided, use it
		if (
			deploymentData.adaptiveCard &&
			Object.keys(deploymentData.adaptiveCard).length > 0
		) {
			return {
				contentType: 'application/vnd.microsoft.card.adaptive',
				content: deploymentData.adaptiveCard,
			};
		}

		// Otherwise, generate default card from data
		const startDate = new Date(deploymentData.startTime);
		const formattedTime = startDate.toLocaleString('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
		});

		const card = {
			type: 'AdaptiveCard',
			$schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.4',
			body: [
				{
					type: 'TextBlock',
					text: '🚀 Deployment Started',
					weight: 'Bolder',
					size: 'Large',
					color: 'Attention',
				},
				{
					type: 'FactSet',
					facts: [
						{
							title: 'Service:',
							value: deploymentData.service,
						},
						{
							title: 'Repository:',
							value: deploymentData.repository,
						},
						{
							title: 'Environment:',
							value: deploymentData.environment,
						},
						{
							title: 'Version:',
							value: deploymentData.version,
						},
						{
							title: 'Commit SHA:',
							value: deploymentData.commitSha.substring(0, 7), // Short SHA
						},
						{
							title: 'Triggered By:',
							value: deploymentData.triggeredBy,
						},
						{
							title: 'Start Time:',
							value: formattedTime,
						},
					],
				},
			],
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'View Pipeline',
					url: deploymentData.pipelineUrl,
				},
				{
					type: 'Action.OpenUrl',
					title: 'View Repository',
					url: deploymentData.repositoryUrl,
				},
			],
		};

		return {
			contentType: 'application/vnd.microsoft.card.adaptive',
			content: card,
		};
	}

	/**
	 * Creates an Adaptive Card for successful deployment
	 * If custom adaptiveCard is provided in the request, it will be used instead
	 */
	static createSuccessCard(resultData: IFinishDeploymentRequest): Attachment {
		// If custom adaptive card is provided, use it
		if (
			resultData.adaptiveCard &&
			Object.keys(resultData.adaptiveCard).length > 0
		) {
			return {
				contentType: 'application/vnd.microsoft.card.adaptive',
				content: resultData.adaptiveCard,
			};
		}

		// Otherwise, generate default card from data
		const endDate = new Date(resultData.endTime);
		const formattedTime = endDate.toLocaleString('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
		});

		const durationMinutes = Math.floor(resultData.durationSeconds / 60);
		const durationRemainingSeconds = resultData.durationSeconds % 60;
		const formattedDuration =
			durationMinutes > 0
				? `${durationMinutes}m ${durationRemainingSeconds}s`
				: `${durationRemainingSeconds}s`;

		const card = {
			type: 'AdaptiveCard',
			$schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.4',
			body: [
				{
					type: 'TextBlock',
					text: '✅ Deployment Successful',
					weight: 'Bolder',
					size: 'Large',
					color: 'Good',
				},
				{
					type: 'TextBlock',
					text: `The deployment of **${resultData.service}** to **${resultData.environment}** completed successfully.`,
					wrap: true,
				},
				{
					type: 'FactSet',
					facts: [
						{
							title: 'Service:',
							value: resultData.service,
						},
						{
							title: 'Repository:',
							value: resultData.repository,
						},
						{
							title: 'Environment:',
							value: resultData.environment,
						},
						{
							title: 'End Time:',
							value: formattedTime,
						},
						{
							title: 'Duration:',
							value: formattedDuration,
						},
					],
				},
			],
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'View Pipeline',
					url: resultData.pipelineUrl,
				},
				{
					type: 'Action.OpenUrl',
					title: 'View Logs',
					url: resultData.logsUrl,
				},
				{
					type: 'Action.OpenUrl',
					title: 'View Repository',
					url: resultData.repositoryUrl,
				},
			],
		};

		return {
			contentType: 'application/vnd.microsoft.card.adaptive',
			content: card,
		};
	}

	/**
	 * Creates an Adaptive Card for failed deployment
	 * If custom adaptiveCard is provided in the request, it will be used instead
	 */
	static createFailureCard(resultData: IFinishDeploymentRequest): Attachment {
		// If custom adaptive card is provided, use it
		if (
			resultData.adaptiveCard &&
			Object.keys(resultData.adaptiveCard).length > 0
		) {
			return {
				contentType: 'application/vnd.microsoft.card.adaptive',
				content: resultData.adaptiveCard,
			};
		}

		// Otherwise, generate default card from data
		const endDate = new Date(resultData.endTime);
		const formattedTime = endDate.toLocaleString('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
		});

		const durationMinutes = Math.floor(resultData.durationSeconds / 60);
		const durationRemainingSeconds = resultData.durationSeconds % 60;
		const formattedDuration =
			durationMinutes > 0
				? `${durationMinutes}m ${durationRemainingSeconds}s`
				: `${durationRemainingSeconds}s`;

		const card = {
			type: 'AdaptiveCard',
			$schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.4',
			body: [
				{
					type: 'TextBlock',
					text: '❌ Deployment Failed',
					weight: 'Bolder',
					size: 'Large',
					color: 'Attention',
				},
				{
					type: 'TextBlock',
					text: `The deployment of **${resultData.service}** to **${resultData.environment}** encountered an error.`,
					wrap: true,
				},
				...(resultData.errorSummary
					? [
							{
								type: 'TextBlock',
								text: `**Error:** ${resultData.errorSummary}`,
								wrap: true,
								color: 'Attention',
							},
						]
					: []),
				{
					type: 'FactSet',
					facts: [
						{
							title: 'Service:',
							value: resultData.service,
						},
						{
							title: 'Repository:',
							value: resultData.repository,
						},
						{
							title: 'Environment:',
							value: resultData.environment,
						},
						{
							title: 'End Time:',
							value: formattedTime,
						},
						{
							title: 'Duration:',
							value: formattedDuration,
						},
					],
				},
			],
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'View Pipeline',
					url: resultData.pipelineUrl,
				},
				{
					type: 'Action.OpenUrl',
					title: 'View Error Logs',
					url: resultData.logsUrl,
				},
				{
					type: 'Action.OpenUrl',
					title: 'View Repository',
					url: resultData.repositoryUrl,
				},
			],
		};

		return {
			contentType: 'application/vnd.microsoft.card.adaptive',
			content: card,
		};
	}
}
