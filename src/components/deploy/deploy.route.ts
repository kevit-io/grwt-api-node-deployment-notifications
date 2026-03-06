import { Router } from 'express';
import { DeployController } from './deploy.controller';
import { authenticateGitHub } from '../../shared/middleware/github-auth.middleware';

const router = Router();

/**
 * POST /deploy/start
 * Start a deployment and get the thread ID
 * Protected with GitHub Actions OIDC authentication
 */
router.post('/start', authenticateGitHub, DeployController.startDeployment);

/**
 * POST /deploy/result
 * Post deployment result as a reply to the thread
 * Protected with GitHub Actions OIDC authentication
 */
router.post('/result', authenticateGitHub, DeployController.finishDeployment);

/**
 * POST /deploy/alert
 * Post a standalone failure alert to a channel (no thread ID needed)
 * Used for DevOps-channel notifications that don't track a thread
 * Protected with GitHub Actions OIDC authentication
 */
router.post('/alert', authenticateGitHub, DeployController.sendAlert);

/**
 * POST /deploy/messages
 * Handle incoming Teams messages (for bot installation, etc.)
 * This endpoint is called by Microsoft Teams - no GitHub auth needed
 */
router.post('/messages', DeployController.handleTeamsMessages);

export const deployRoutes = router;
