import {
	BotFrameworkAdapter,
	TurnContext,
	Activity,
	ConversationReference,
} from 'botbuilder';
import { MicrosoftAppCredentials } from 'botframework-connector';
import { Request, Response } from 'express';
import { AdaptiveCardBuilder } from './deploy.cards';
import { TeamsMessageBuilder } from './deploy.messages';
import {
	IStartDeploymentRequest,
	IFinishDeploymentRequest,
} from './deploy.interface';
import { DeploymentEmailService } from './deploy.email';
import { log } from '../../shared/utils/logger';
import Config from '../../config';

/**
 * Service for handling Microsoft Teams bot messaging
 */
export class DeployNotificationService {
	private adapter: BotFrameworkAdapter;

	private conversationReference: Partial<ConversationReference> | null = null;

	private emailService: DeploymentEmailService;

	constructor() {
		// Configure Microsoft App Credentials with tenant-specific settings
		// This is critical for single-tenant bot applications
		if (Config.bot.tenantId) {
			MicrosoftAppCredentials.trustServiceUrl(
				'https://smba.trafficmanager.net/amer/',
			);
		}

		// Initialize Bot Framework Adapter
		this.adapter = new BotFrameworkAdapter({
			appId: Config.bot.appId,
			appPassword: Config.bot.appPassword,
			// Specify the channel authority for single-tenant apps
			channelAuthTenant: Config.bot.tenantId,
		});

		// Error handler for adapter
		this.adapter.onTurnError = async (context: TurnContext, error: Error) => {
			log.error(`Bot error: ${error.message}`, error);
			await context.sendActivity('Sorry, an error occurred.');
		};

		this.emailService = new DeploymentEmailService();
	}

	/**
	 * Initialize the bot by setting up the conversation reference
	 * This should be called when the bot is installed or receives its first message
	 */
	public initialize(
		serviceUrl: string,
		conversationId: string,
		tenantId?: string,
	): void {
		this.conversationReference = {
			serviceUrl,
			conversation: {
				id: conversationId,
				isGroup: true,
				conversationType: 'channel',
				tenantId,
				name: '',
			},
			channelId: 'msteams',
		};
		log.info('Bot conversation reference initialized');
	}

	/**
	 * Get the stored conversation reference
	 * In a production scenario, this would come from environment variables or configuration
	 */
	private getConversationReference(
		channelId?: string,
		tenantId?: string,
	): Partial<ConversationReference> {
		if (this.conversationReference) {
			return this.conversationReference;
		}

		// Fall back to configuration if available
		if (Config.bot.serviceUrl && Config.bot.conversationId) {
			return {
				serviceUrl: Config.bot.serviceUrl,
				conversation: {
					id: Config.bot.conversationId,
					isGroup: true,
					conversationType: 'channel',
					tenantId: Config.bot.tenantId,
					name: '',
				},
				channelId: 'msteams',
			};
		}

		// If channelId provided, create conversation reference dynamically
		if (channelId) {
			return {
				serviceUrl:
					Config.bot.serviceUrl || 'https://smba.trafficmanager.net/amer/',
				conversation: {
					id: channelId,
					isGroup: true,
					conversationType: 'channel',
					tenantId: tenantId || Config.bot.tenantId,
					name: '',
				},
				channelId: 'msteams',
			};
		}

		throw new Error(
			'Conversation reference not initialized. Please set up bot configuration.',
		);
	}

	/**
	 * Send deployment start notification
	 * Returns the activity ID (thread ID) for future replies
	 */
	public async sendStartNotification(
		deploymentData: IStartDeploymentRequest,
	): Promise<string> {
		// Use channelId from request to construct conversation reference
		const conversationRef = this.getConversationReference(
			deploymentData.channelId,
			Config.bot.tenantId,
		);

		return new Promise((resolve, reject) => {
			void this.adapter.continueConversation(
				conversationRef,
				async (context: TurnContext) => {
					try {
						const text =
							TeamsMessageBuilder.createStartDeploymentMessage(deploymentData);

						const activity: Partial<Activity> = {
							type: 'message',
							text,
						};

						const response = await context.sendActivity(activity);
						const activityId = response?.id;

						if (!activityId) {
							throw new Error('Failed to get activity ID from Teams response');
						}

						// Fire-and-forget email (don’t block Teams response)
						void this.emailService.sendStartEmail(deploymentData);

						log.info(
							`Deployment start notification sent. Thread ID: ${activityId}`,
							{
								repoName: deploymentData.repoName,
								environment: deploymentData.environment,
							},
						);
						resolve(activityId);
					} catch (error) {
						log.error('Error sending start notification:', error);
						reject(error instanceof Error ? error : new Error(String(error)));
					}
				},
			);
		});
	}

	/**
	 * Send deployment result notification as a reply to the original thread
	 */
	public async sendResultNotification(
		resultData: IFinishDeploymentRequest,
	): Promise<void> {
		const conversationRef = this.getConversationReference(
			resultData.channelId,
			Config.bot.tenantId,
		);

		// Update conversation reference to include the thread ID
		const threadConversationRef: Partial<ConversationReference> = {
			...conversationRef,
			conversation: conversationRef.conversation
				? {
						id: `${conversationRef.conversation.id};messageid=${resultData.threadId}`,
						isGroup: conversationRef.conversation.isGroup,
						conversationType: conversationRef.conversation.conversationType,
						tenantId: conversationRef.conversation.tenantId,
						name: conversationRef.conversation.name,
					}
				: undefined,
			activityId: resultData.threadId,
		};

		return new Promise((resolve, reject) => {
			void this.adapter.continueConversation(
				threadConversationRef,
				async (context: TurnContext) => {
					try {
						// NOTE: We intentionally *don't* use Adaptive Cards for deployment notifications right now.
						// In some Teams clients/tenants, card-only activities don't reliably trigger the same
						// toast/notification behavior as plain text messages. Markdown text provides a more
						// consistent notification experience.
						//
						// (We keep the AdaptiveCardBuilder code around for future use / easy rollback.)
						const text =
							resultData.status === 'success'
								? TeamsMessageBuilder.createSuccessDeploymentMessage(resultData)
								: TeamsMessageBuilder.createFailureDeploymentMessage(
										resultData,
									);

						const activity: Partial<Activity> = {
							type: 'message',
							text,
						};
						await context.sendActivity(activity);

						// Fire-and-forget email
						void this.emailService.sendFinishEmail(resultData);

						log.info(
							`Deployment ${resultData.status} notification sent as reply to thread ${resultData.threadId}`,
							{
								repoName: resultData.repoName,
								environment: resultData.environment,
								durationInSeconds: resultData.durationInSeconds,
							},
						);
						resolve();
					} catch (error) {
						log.error('Error sending result notification:', error);
						reject(error instanceof Error ? error : new Error(String(error)));
					}
				},
			);
		});
	}

	/**
	 * Handle incoming activities from Teams (for bot installation, mentions, etc.)
	 * This is optional but useful for capturing conversation reference automatically
	 */
	public async processIncomingActivity(
		req: Request,
		res: Response,
	): Promise<void> {
		await this.adapter.process(req, res, async (context: TurnContext) => {
			if (context.activity.type === 'message') {
				// Bot was mentioned or received a message
				await context.sendActivity(
					"👋 Hi! I'm the CI/CD Deployment Notification Bot. I'll post deployment updates here automatically.",
				);
			} else if (context.activity.type === 'conversationUpdate') {
				// Bot was added to the team/channel
				if (context.activity.membersAdded) {
					for (const member of context.activity.membersAdded) {
						if (member.id !== context.activity.recipient.id) {
							continue;
						}

						// Bot was added - capture conversation reference
						const conversationId = context.activity.conversation.id;
						const serviceUrl = context.activity.serviceUrl;
						const tenantId = context.activity.conversation.tenantId;

						this.initialize(serviceUrl, conversationId, tenantId);

						log.info('Bot added to channel:', {
							conversationId,
							serviceUrl,
							tenantId,
						});

						await context.sendActivity(
							"✅ Deployment notification bot installed! I'll post deployment updates here.",
						);
					}
				}
			}
		});
	}
}
