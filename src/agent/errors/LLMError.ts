export enum LLMErrorCode {
  API_REQUEST_FAILED = 'API_REQUEST_FAILED',
  API_CONNECTION_ERROR = 'API_CONNECTION_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_AUTH_FAILED = 'API_AUTH_FAILED',
  API_INVALID_RESPONSE = 'API_INVALID_RESPONSE',
  STREAM_READ_ERROR = 'STREAM_READ_ERROR',
  CONFIG_INVALID = 'CONFIG_INVALID',
}

export class LLMError extends Error {
  public readonly code: LLMErrorCode;
  public readonly statusCode?: number;
  public readonly timestamp: number;
  public readonly cause?: Error;

  constructor(
    code: LLMErrorCode,
    message: string,
    options: {
      statusCode?: number;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'LLMError';
    this.code = code;
    this.statusCode = options.statusCode;
    this.timestamp = Date.now();
    this.cause = options.cause;
  }
}

export function isLLMError(error: unknown): error is LLMError {
  return error instanceof LLMError;
}
