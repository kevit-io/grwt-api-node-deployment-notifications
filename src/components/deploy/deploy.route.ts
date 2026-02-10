import { Router } from 'express';
import { DeployController } from './deploy.controller';

const router = Router();

/**
 * POST /deploy/start
 * Start a deployment and get the thread ID
 */
router.post('/start', DeployController.startDeployment);

/**
 * POST /deploy/result
 * Post deployment result as a reply to the thread
 */
router.post('/result', DeployController.finishDeployment);

/**
 * POST /deploy/messages
 * Handle incoming Teams messages (for bot installation, etc.)
 */
router.post('/messages', DeployController.handleTeamsMessages);

export const deployRoutes = router;
