import nodemailer, { Transporter } from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import { log } from '../../shared/utils/logger';
import { formatToIST } from '../../shared/utils/timezone';
import { trimToMaxLength } from '../../shared/utils/text';
import {
	IFinishDeploymentRequest,
	IStartDeploymentRequest,
	IDeployFinishEmailPayload,
	IDeployStartEmailPayload,
} from './deploy.interface';

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function parseEmailIds(emailIds?: string): string[] {
	if (!emailIds) {
		return [];
	}
	return emailIds
		.split(',')
		.map((e) => e.trim())
		.filter((e) => e.length > 0)
		.filter(isValidEmail);
}

function getTemplatesDir(): string {
	// Compiled JS will live under lib/components/deploy, so go up 3 levels to lib/and then to components/deploy/email-templates.
	// In ts-node/dev, __dirname points under src/components/deploy.
	return path.resolve(__dirname, 'email-templates');
}

function loadTemplate(templateName: string): string {
	const filePath = path.join(getTemplatesDir(), templateName);
	return fs.readFileSync(filePath, 'utf-8');
}

function render(template: string, vars: Record<string, string>): string {
	let out = template;
	for (const [key, value] of Object.entries(vars)) {
		out = out.split(`{{${key}}}`).join(value);
	}
	return out;
}

function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
	if (minutes > 0) return `${minutes}m ${secs}s`;
	return `${secs}s`;
}

export class DeploymentEmailService {
	private transporter: Transporter;

	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.SMTP_PORT || '587', 10),
			secure: process.env.SMTP_SECURE === 'true',
			auth: process.env.SMTP_USER
				? {
						user: process.env.SMTP_USER,
						pass: process.env.SMTP_PASS,
					}
				: undefined,
		});
	}

	public async sendStartEmail(data: IStartDeploymentRequest): Promise<void> {
		const recipients = parseEmailIds(data.emailIds);
		if (recipients.length === 0) return;

		const payload: IDeployStartEmailPayload = {
			repoName: data.repoName,
			repoLink: data.repoLink,
			triggerTitle: data.triggerTitle,
			triggerLink: data.triggerLink,
			environment: data.environment,
			actionLink: data.actionLink,
			triggerBy: data.triggerBy,
			startTimeIst: formatToIST(data.startTime),
		};

		const subject = `${data.environment} - deploy started for ${data.repoName}`;

		const html = render(loadTemplate('deploy-start.html'), {
			...payload,
		});

		await this.sendMail(recipients, subject, html, {
			type: 'start',
			repoName: data.repoName,
			environment: data.environment,
		});
	}

	public async sendFinishEmail(data: IFinishDeploymentRequest): Promise<void> {
		const recipients = parseEmailIds(data.emailIds);
		if (recipients.length === 0) return;

		const isSuccess = data.status === 'success';
		const statusVerb = isSuccess ? 'succeeded' : 'failed';

		const errorMessageTrimmed = data.errorMessage
			? trimToMaxLength(data.errorMessage, 300)
			: '';

		const payload: IDeployFinishEmailPayload = {
			repoName: data.repoName,
			repoLink: data.repoLink,
			environment: data.environment,
			status: data.status,
			statusUpper: data.status.toUpperCase(),
			statusVerb,
			triggerBy: data.triggerBy,
			durationInSeconds: String(data.durationInSeconds),
			durationHuman: formatDuration(data.durationInSeconds),
			startTimeIst: formatToIST(data.startTime),
			errorMessage: errorMessageTrimmed,
			logsLink: data.logsLink,
			ifError: data.errorMessage ? ' ' : '',
		};

		let html = loadTemplate('deploy-finish.html');
		html = render(html, payload as unknown as Record<string, string>);

		// Tiny conditional handling without adding a full templating engine
		if (data.errorMessage) {
			html = html.replace('{{#ifError}}', '').replace('{{/ifError}}', '');
		} else {
			const start = html.indexOf('{{#ifError}}');
			const end = html.indexOf('{{/ifError}}');
			if (start !== -1 && end !== -1 && end > start) {
				html = html.slice(0, start) + html.slice(end + '{{/ifError}}'.length);
			}
			// Remove any leftover markers
			html = html.replace('{{#ifError}}', '').replace('{{/ifError}}', '');
		}

		const subject = `${data.environment} - deploy ${statusVerb} for ${data.repoName}`;

		await this.sendMail(recipients, subject, html, {
			type: 'finish',
			repoName: data.repoName,
			environment: data.environment,
			status: data.status,
		});
	}

	private async sendMail(
		recipients: string[],
		subject: string,
		html: string,
		meta: Record<string, unknown>,
	): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: process.env.SMTP_FROM || process.env.SMTP_USER,
				to: recipients.join(', '),
				subject,
				html,
			});

			log.info('Deployment email sent', {
				recipients: recipients.length,
				...meta,
			});
		} catch (error) {
			log.error('Failed to send deployment email', error);
			throw error;
		}
	}
}
