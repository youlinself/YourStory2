import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LLMError, LLMErrorCode, isLLMError } from './LLMError';

describe('LLMError', () => {
  describe('constructor', () => {
    it('should create instance with code and message', () => {
      const error = new LLMError(LLMErrorCode.API_REQUEST_FAILED, 'API request failed');
      assert.equal(error.code, LLMErrorCode.API_REQUEST_FAILED);
      assert.equal(error.message, 'API request failed');
      assert.equal(error.name, 'LLMError');
    });

    it('should create instance with status code', () => {
      const error = new LLMError(LLMErrorCode.API_AUTH_FAILED, 'Auth failed', { statusCode: 401 });
      assert.equal(error.statusCode, 401);
    });

    it('should create instance with cause', () => {
      const cause = new Error('Network error');
      const error = new LLMError(LLMErrorCode.API_CONNECTION_ERROR, 'Connection failed', { cause });
      assert.equal(error.cause, cause);
    });

    it('should have timestamp', () => {
      const before = Date.now();
      const error = new LLMError(LLMErrorCode.API_REQUEST_FAILED, 'Failed');
      const after = Date.now();
      assert.ok(error.timestamp >= before && error.timestamp <= after);
    });
  });

  describe('error codes', () => {
    it('should have API_REQUEST_FAILED code', () => {
      assert.equal(LLMErrorCode.API_REQUEST_FAILED, 'API_REQUEST_FAILED');
    });

    it('should have API_CONNECTION_ERROR code', () => {
      assert.equal(LLMErrorCode.API_CONNECTION_ERROR, 'API_CONNECTION_ERROR');
    });

    it('should have API_TIMEOUT code', () => {
      assert.equal(LLMErrorCode.API_TIMEOUT, 'API_TIMEOUT');
    });

    it('should have API_RATE_LIMITED code', () => {
      assert.equal(LLMErrorCode.API_RATE_LIMITED, 'API_RATE_LIMITED');
    });

    it('should have API_AUTH_FAILED code', () => {
      assert.equal(LLMErrorCode.API_AUTH_FAILED, 'API_AUTH_FAILED');
    });

    it('should have API_INVALID_RESPONSE code', () => {
      assert.equal(LLMErrorCode.API_INVALID_RESPONSE, 'API_INVALID_RESPONSE');
    });

    it('should have STREAM_READ_ERROR code', () => {
      assert.equal(LLMErrorCode.STREAM_READ_ERROR, 'STREAM_READ_ERROR');
    });

    it('should have CONFIG_INVALID code', () => {
      assert.equal(LLMErrorCode.CONFIG_INVALID, 'CONFIG_INVALID');
    });
  });

  describe('isLLMError', () => {
    it('should return true for LLMError instances', () => {
      const error = new LLMError(LLMErrorCode.API_REQUEST_FAILED, 'Failed');
      assert.equal(isLLMError(error), true);
    });

    it('should return false for regular Error instances', () => {
      const error = new Error('Regular error');
      assert.equal(isLLMError(error), false);
    });

    it('should return false for non-error values', () => {
      assert.equal(isLLMError('string'), false);
      assert.equal(isLLMError(null), false);
      assert.equal(isLLMError(undefined), false);
      assert.equal(isLLMError({}), false);
    });
  });

  describe('error inheritance', () => {
    it('should be instance of Error', () => {
      const error = new LLMError(LLMErrorCode.API_REQUEST_FAILED, 'Failed');
      assert.ok(error instanceof Error);
    });

    it('should be instance of LLMError', () => {
      const error = new LLMError(LLMErrorCode.API_REQUEST_FAILED, 'Failed');
      assert.ok(error instanceof LLMError);
    });

    it('should have stack trace', () => {
      const error = new LLMError(LLMErrorCode.API_REQUEST_FAILED, 'Failed');
      assert.ok(error.stack);
      assert.match(error.stack!, /LLMError/);
    });
  });
});
