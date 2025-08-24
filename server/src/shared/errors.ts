export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
  isOperational: boolean;

  constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
