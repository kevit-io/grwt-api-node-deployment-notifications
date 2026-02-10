import { Request, Response, NextFunction } from 'express';
import { DeployNotificationService } from './deploy.service';
import {
	IStartDeploymentRequest,
	IStartDeploymentResponse,
	IFinishDeploymentRequest,
} from './deploy.interface';
import { log } from '../../shared/utils/logger';
import HttpException from '../../shared/utils/errors.utills';

// Singleton instance of the notification service
const notificationService = new DeployNotificationService();

/**
 * Controller for deployment notification endpoints
 */
export class DeployController {
	/**
	 * POST /deploy/start
	 * Sends a deployment start notification to Teams and returns the thread ID
	 */
	public static async startDeployment(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const deploymentData = req.body as IStartDeploymentRequest;

			// Validate required fields
			const requiredFields = [
				'teamId',
				'channelId',
				'service',
				'repository',
				'repositoryUrl',
				'environment',
				'version',
				'pipelineUrl',
				'commitSha',
				'triggeredBy',
				'startTime',
			];

			const missingFields = requiredFields.filter(
				(field) => !deploymentData[field as keyof IStartDeploymentRequest],
			);

			if (missingFields.length > 0) {
				throw new HttpException(
					400,
					`Missing required fields: ${missingFields.join(', ')}`,
					'VALIDATION_ERROR',
					'Missing required fields',
				);
			}

			log.info('Starting deployment notification', {
				service: deploymentData.service,
				environment: deploymentData.environment,
				version: deploymentData.version,
				repository: deploymentData.repository,
			});

			// Send notification and get thread ID
			const threadId =
				await notificationService.sendStartNotification(deploymentData);

			const response: IStartDeploymentResponse = {
				threadId,
			};

			res.status(200).json({
				success: true,
				message: 'Deployment start notification sent',
				data: response,
			});
		} catch (error) {
			log.error('Error in startDeployment:', error);
			next(error);
		}
	}

	/**
	 * POST /deploy/result
	 * Sends a deployment result notification as a reply to the original thread
	 */
	public static async finishDeployment(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const resultData = req.body as IFinishDeploymentRequest;

			// Validate required fields
			const requiredFields = [
				'teamId',
				'channelId',
				'threadId',
				'service',
				'repository',
				'repositoryUrl',
				'environment',
				'status',
				'endTime',
				'durationSeconds',
				'pipelineUrl',
				'logsUrl',
			];

			const missingFields = requiredFields.filter(
				(field) => !resultData[field as keyof IFinishDeploymentRequest],
			);

			if (missingFields.length > 0) {
				throw new HttpException(
					400,
					`Missing required fields: ${missingFields.join(', ')}`,
					'VALIDATION_ERROR',
					'Missing required fields',
				);
			}

			// Validate status value
			if (resultData.status !== 'success' && resultData.status !== 'failure') {
				throw new HttpException(
					400,
					'Invalid status. Must be "success" or "failure"',
					'VALIDATION_ERROR',
					'Invalid status value',
				);
			}

			log.info('Finishing deployment notification', {
				threadId: resultData.threadId,
				status: resultData.status,
				service: resultData.service,
				environment: resultData.environment,
			});

			// Send result notification as reply
			await notificationService.sendResultNotification(resultData);

			res.status(200).json({
				success: true,
				message: 'Deployment result notification sent',
				data: {
					threadId: resultData.threadId,
					status: resultData.status,
				},
			});
		} catch (error) {
			log.error('Error in finishDeployment:', error);
			next(error);
		}
	}

	/**
	 * POST /deploy/messages
	 * Handles incoming messages from Teams (for bot installation, etc.)
	 */
	public static async handleTeamsMessages(
		req: Request,
		res: Response,
	): Promise<void> {
		try {
			await notificationService.processIncomingActivity(req, res);
		} catch (error) {
			log.error('Error handling Teams messages:', error);
			res.status(500).send('Error processing Teams message');
		}
	}
}
