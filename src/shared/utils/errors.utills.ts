function getErrorFromCode(statusCode: number | string) {
	switch (statusCode) {
		case 500: {
			return 'INTERNAL_SERVER_ERROR';
		}
		case 400: {
			return 'BAD_REQUEST';
		}
		case 401: {
			return 'UNAUTHORIZED';
		}
		case 424: {
			return 'FAILED_DEPENDENCY';
		}
		case 404: {
			return 'NOT_FOUND';
		}
		default:
			return 'UNHANDLED_ERROR';
	}
}

export default class HttpException extends Error {
	statusCode: number;

	errorType: string;

	errorCode: string;

	message: string;

	originalError: unknown;

	meta: string | null;

	constructor(
		statusCode: number,
		message: string,
		errorCode: string,
		// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
		err: unknown | string,
		meta = null,
	) {
		super(message);
		this.statusCode = statusCode;
		this.errorType = getErrorFromCode(statusCode);
		this.errorCode = errorCode;
		this.message = message;
		this.originalError = message;
		this.meta = meta;
	}
}
