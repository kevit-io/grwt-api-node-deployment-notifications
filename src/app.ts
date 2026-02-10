import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import * as bodyParser from 'body-parser';
import { config } from 'dotenv';
import cors from 'cors';

config();

import Config from './config';
import ApplicationConfig from './application.routes';
import { log } from './shared/utils/logger';
import HttpException from './shared/utils/errors.utills';

const PORT: string | number = Config.server.port;

class App {
	app: express.Application;

	constructor() {
		this.app = express();
		const server = createServer(this.app);
		if (process.env.NODE_ENV !== 'test') {
			server.listen(PORT, () => {
				log.info(`🚀 Server started on port ${PORT}`);
			});
		}
		this.config();
	}

	private config(): void {
		// this.app.use(morganInstance);
		this.app.use(
			cors({
				origin: true,
				methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
				allowedHeaders: [
					'Origin',
					' X-Requested-With',
					' Content-Type',
					' Accept ',
					' Authorization',
					'x-ms-bot-agent',
					'User-Agent',
				],
			}),
		);
		this.app.use(bodyParser.json({ limit: '50mb' }));
		this.app.use(
			bodyParser.urlencoded({
				extended: true,
				limit: '50mb',
				parameterLimit: 500000,
			}),
		);

		ApplicationConfig.registerRoute(this.app);

		this.app.use(express.static('public')); //it serves static files.

		/**
		 * Catch 404 routes
		 */
		this.app.use((req: Request, res: Response, next: NextFunction) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const err: any = new Error('Invalid route');
			err.status = 404;
			err.message = 'Invalid route';
			next(err);
		});

		// /**
		//  * Error Handler
		//  */
		this.app.use(
			(err: HttpException, req: Request, res: Response, next: NextFunction) => {
				res.status(err.statusCode || 500);
				res.json(err);
				next(err);
			},
		);
	}
}

export const { app } = new App();
