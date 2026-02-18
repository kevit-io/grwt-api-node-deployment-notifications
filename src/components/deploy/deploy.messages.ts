import { formatToIST } from '../../shared/utils/timezone';
import {
	IStartDeploymentRequest,
	IFinishDeploymentRequest,
} from './deploy.interface';
import { trimToMaxLength } from '../../shared/utils/text';

function mdLink(text: string, url?: string): string {
	return url ? `[${text}](${url})` : text;
}

function joinTeamsLines(lines: Array<string | undefined | null>): string {
	// Teams is sometimes picky about line breaks; CRLF is the safest.
	return lines.filter(Boolean).join('\r\n');
}

/**
 * Builder for Teams-safe message bodies.
 *
 * Note: Bot Framework / Teams doesn't support arbitrary rich HTML in message bodies.
 * Use plain text + a limited Markdown subset.
 */
export class TeamsMessageBuilder {
	static createStartDeploymentMessage(
		data: IStartDeploymentRequest,
		options?: { compact?: boolean },
	): string {
		const title = `🔵 **${data.repoName}** - **[${data.environment}]** - Deployment Started`;
		if (options?.compact) {
			return title;
		}
		const startTime = formatToIST(data.startTime);
		const details = [
			`- **Repository:** ${mdLink(data.repoName, data.repoLink)}`,
			`- **Trigger:** ${mdLink(data.triggerTitle, data.triggerLink)}`,
			`- **Environment:** ${data.environment}`,
			`- **Triggered by:** ${data.triggerBy}`,
			`- **Start time:** ${startTime}`,
		];

		// Keep it simple and notification-friendly: a single text field with Markdown.
		return joinTeamsLines([
			title,
			'',
			...details,
			'',
			data.actionLink
				? `➡️ [Go to Action Runner](${data.actionLink})`
				: undefined,
		]);
	}

	static createSuccessDeploymentMessage(
		data: IFinishDeploymentRequest,
	): string {
		const title = `🟢 **${data.repoName}** - **[${data.environment}]** - Deployment Succeeded`;
		const startTime = formatToIST(data.startTime);
		const details = [
			`- **Repository:** ${mdLink(data.repoName, data.repoLink)}`,
			`- **Environment:** ${data.environment}`,
			`- **Status:** SUCCESS`,
			`- **Triggered by:** ${data.triggerBy}`,
			`- **Duration:** ${String(data.durationInSeconds)} seconds (started at ${startTime})`,
		];

		return joinTeamsLines([title, '', ...details]);
	}

	static createFailureDeploymentMessage(
		data: IFinishDeploymentRequest,
	): string {
		const title = `🔴 **${data.repoName}** - **[${data.environment}]** - Deployment Failed`;
		const startTime = formatToIST(data.startTime);
		const errorMessage = data.errorMessage
			? trimToMaxLength(data.errorMessage, 300)
			: '';

		const details: string[] = [
			`- **Repository:** ${mdLink(data.repoName, data.repoLink)}`,
			`- **Environment:** ${data.environment}`,
			`- **Status:** FAIL`,
			`- **Triggered by:** ${data.triggerBy}`,
			`- **Duration:** ${String(data.durationInSeconds)} seconds (started at ${startTime})`,
		];

		if (errorMessage) {
			details.push(
				data.logsLink
					? `- **Error:** ${mdLink(errorMessage, data.logsLink)}`
					: `- **Error:** ${errorMessage}`,
			);
		}

		return joinTeamsLines([title, '', ...details]);
	}
}
