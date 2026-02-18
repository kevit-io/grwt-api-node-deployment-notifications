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
	// Templates must be readable in both scenarios:
	// - dev: running TS from src/**
	// - prod: running compiled JS from lib/**
	//
	// In production, src/** usually isn't shipped, so we first look for templates next to lib/**.
	// In dev, we fall back to src/**.
	const candidates = [
		path.resolve(
			process.cwd(),
			'lib',
			'components',
			'deploy',
			'email-templates',
		),
		path.resolve(
			process.cwd(),
			'src',
			'components',
			'deploy',
			'email-templates',
		),
	];

	for (const dir of candidates) {
		try {
			if (fs.existsSync(dir)) return dir;
		} catch {
			// ignore
		}
	}

	// As a last resort, keep the original src path (will throw on read if missing).
	return candidates[candidates.length - 1];
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

		// Keep email content aligned with the Teams message fields.
		const payload = {
			repoName: data.repoName,
			repoLink: data.repoLink,
			triggerTitle: data.triggerTitle,
			triggerLink: data.triggerLink,
			environment: data.environment,
			actionLink: data.actionLink,
			triggerBy: data.triggerBy,
			startTimeIst: formatToIST(data.startTime),
		};

		const subject = `Deployment started for ${data.repoName} on ${data.environment}`;

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

		// Keep email content aligned with the Teams message fields.
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
		};

		let html = loadTemplate('deploy-finish.html');
		html = render(html, {
			...(payload as unknown as Record<string, string>),
			statusCss: data.status === 'success' ? 'success' : 'failure',
		});

		// Handle conditional sections for error display
		// Teams message combines error with logs link if available
		if (data.errorMessage) {
			html = html.replace('{{#ifError}}', '').replace('{{/ifError}}', '');

			// If logs link exists, show error as link; otherwise show in code block
			if (data.logsLink) {
				html = html
					.replace('{{#ifLogsLink}}', '')
					.replace('{{/ifLogsLink}}', '');
				// Remove the ifErrorOnly section
				const errorOnlyStart = html.indexOf('{{#ifErrorOnly}}');
				const errorOnlyEnd = html.indexOf('{{/ifErrorOnly}}');
				if (errorOnlyStart !== -1 && errorOnlyEnd !== -1) {
					html =
						html.slice(0, errorOnlyStart) +
						html.slice(errorOnlyEnd + '{{/ifErrorOnly}}'.length);
				}
			} else {
				// Remove the ifLogsLink section
				const logsLinkStart = html.indexOf('{{#ifLogsLink}}');
				const logsLinkEnd = html.indexOf('{{/ifLogsLink}}');
				if (logsLinkStart !== -1 && logsLinkEnd !== -1) {
					html =
						html.slice(0, logsLinkStart) +
						html.slice(logsLinkEnd + '{{/ifLogsLink}}'.length);
				}
				html = html
					.replace('{{#ifErrorOnly}}', '')
					.replace('{{/ifErrorOnly}}', '');
			}
		} else {
			// No error message - remove entire error section
			const start = html.indexOf('{{#ifError}}');
			const end = html.indexOf('{{/ifError}}');
			if (start !== -1 && end !== -1 && end > start) {
				html = html.slice(0, start) + html.slice(end + '{{/ifError}}'.length);
			}
			html = html.replace('{{#ifError}}', '').replace('{{/ifError}}', '');
		}

		const subject = `Depoyment ${statusVerb} for ${data.repoName} on ${data.environment}`;
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
				// SES SMTP credentials (SMTP_USER/SMTP_PASS) are for authentication.
				// The email identity should be configured separately.
				from:
					process.env.SMTP_FROM_EMAIL ||
					process.env.SMTP_FROM ||
					process.env.SMTP_USER,
				replyTo: process.env.SMTP_REPLY_TO_EMAIL || undefined,
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
