import { Attachment } from 'botbuilder';
import {
	IStartDeploymentRequest,
	IFinishDeploymentRequest,
} from './deploy.interface';
import { formatToIST } from '../../shared/utils/timezone';
import { trimToMaxLength } from '../../shared/utils/text';

function asMarkdownLink(text: string, url: string): string {
	return url ? `[${text}](${url})` : text;
}

/**
 * Adaptive Card builder for deployment notifications
 *
 * NOTE: This project currently sends Teams notifications as plain text/Markdown messages
 * (see `TeamsMessageBuilder`) because in some Teams clients/tenants, "card-only" activities
 * don't reliably trigger the same toast/notification behavior as normal text messages.
 *
 * We keep these card builders for:
 * - easy rollback if notification behavior changes
 * - future scenarios where richer layouts/actions are required
 */
export class AdaptiveCardBuilder {
	// NOTE: These methods are intentionally kept (even if currently unused) so we can
	// quickly switch back to Adaptive Cards if needed.
	static createStartDeploymentCard(
		deploymentData: IStartDeploymentRequest,
	): Attachment {
		if (
			deploymentData.adaptiveCard &&
			Object.keys(deploymentData.adaptiveCard).length > 0
		) {
			return {
				contentType: 'application/vnd.microsoft.card.adaptive',
				content: deploymentData.adaptiveCard,
			};
		}

		const title = `🔵 ${deploymentData.repoName} - [${deploymentData.environment}] - Deployment Started`;
		const startTime = formatToIST(deploymentData.startTime);

		const card = {
			type: 'AdaptiveCard',
			$schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.5',
			body: [
				{
					type: 'TextBlock',
					text: title,
					weight: 'Bolder',
					size: 'Medium',
					wrap: true,
				},
				{
					type: 'FactSet',
					spacing: 'Medium',
					facts: [
						{
							title: 'Repository',
							value: asMarkdownLink(
								deploymentData.repoName,
								deploymentData.repoLink,
							),
						},
						{
							title: 'Trigger Link',
							value: asMarkdownLink(
								deploymentData.triggerTitle,
								deploymentData.triggerLink,
							),
						},
						{
							title: 'Environment',
							value: deploymentData.environment,
						},
						{
							title: 'Triggered by',
							value: deploymentData.triggerBy,
						},
						{
							title: 'Start time',
							value: startTime,
						},
					],
				},
			],
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'Go to Action Runner',
					url: deploymentData.actionLink,
				},
			],
		};

		return {
			contentType: 'application/vnd.microsoft.card.adaptive',
			content: card,
		};
	}

	static createSuccessCard(resultData: IFinishDeploymentRequest): Attachment {
		if (
			resultData.adaptiveCard &&
			Object.keys(resultData.adaptiveCard).length > 0
		) {
			return {
				contentType: 'application/vnd.microsoft.card.adaptive',
				content: resultData.adaptiveCard,
			};
		}

		const title = `🟢 ${resultData.repoName} - [${resultData.environment}] - Deployment succeeded`;
		const startTime = formatToIST(resultData.startTime);

		const card = {
			type: 'AdaptiveCard',
			$schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.5',
			body: [
				{
					type: 'TextBlock',
					text: title,
					weight: 'Bolder',
					size: 'Medium',
					color: 'Good',
					wrap: true,
				},
				{
					type: 'FactSet',
					spacing: 'Medium',
					facts: [
						{
							title: 'Repository',
							value: asMarkdownLink(resultData.repoName, resultData.repoLink),
						},
						{
							title: 'Environment',
							value: resultData.environment,
						},
						{
							title: 'Status',
							value: 'SUCCESS',
						},
						{
							title: 'Triggered by',
							value: resultData.triggerBy,
						},
						{
							title: 'Duration',
							value: `${String(resultData.durationInSeconds)} seconds (started at ${startTime})`,
						},
					],
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

		const title = `🔴 ${resultData.repoName} - [${resultData.environment}] - Deployment failed`;
		const startTime = formatToIST(resultData.startTime);
		const errorMessage = resultData.errorMessage
			? trimToMaxLength(resultData.errorMessage, 300)
			: '';

		const card = {
			type: 'AdaptiveCard',
			$schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.5',
			body: [
				{
					type: 'TextBlock',
					text: title,
					weight: 'Bolder',
					size: 'Medium',
					color: 'Attention',
					wrap: true,
				},
				{
					type: 'FactSet',
					spacing: 'Medium',
					facts: [
						{
							title: 'Repository',
							value: asMarkdownLink(resultData.repoName, resultData.repoLink),
						},
						{
							title: 'Environment',
							value: resultData.environment,
						},
						{
							title: 'Status',
							value: 'FAIL',
						},
						{
							title: 'Triggered by',
							value: resultData.triggerBy,
						},
						{
							title: 'Duration',
							value: `${String(resultData.durationInSeconds)} seconds (started at ${startTime})`,
						},
						...(errorMessage && resultData.logsLink
							? [
									{
										title: 'Error',
										value: asMarkdownLink(errorMessage, resultData.logsLink),
									},
								]
							: []),
					],
				},
			],
		};

		return {
			contentType: 'application/vnd.microsoft.card.adaptive',
			content: card,
		};
	}
}

// Intentionally reference these methods so IDE/TS inspections don't flag them as "unused"
// while we keep this module around for rollback.
void AdaptiveCardBuilder.createStartDeploymentCard;
void AdaptiveCardBuilder.createSuccessCard;
void AdaptiveCardBuilder.createFailureCard;
