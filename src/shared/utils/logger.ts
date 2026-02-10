/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { config } from 'dotenv';
import { createLogger, transports, format } from 'winston';
config();

const logger = createLogger({
	transports: [new transports.Console({ level: 'silly' })],
	format: format.combine(
		format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
		format.colorize(),
		format.printf(
			({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`,
		),
	),
});

export const log = logger;
