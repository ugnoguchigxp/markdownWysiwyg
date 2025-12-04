import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLogger, createContextLogger } from '../../src/utils/logger';

describe('logger', () => {
    const consoleSpy = {
        log: vi.spyOn(console, 'log').mockImplementation(() => { }),
        info: vi.spyOn(console, 'info').mockImplementation(() => { }),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
        error: vi.spyOn(console, 'error').mockImplementation(() => { }),
        debug: vi.spyOn(console, 'debug').mockImplementation(() => { }),
    };

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create a logger with the given context', () => {
        const logger = createLogger('TestContext');
        expect(logger).toBeDefined();
    });

    it('should log info messages with correct format', () => {
        const logger = createLogger('TestContext');
        logger.info('test message');

        expect(consoleSpy.info).toHaveBeenCalledWith(
            expect.stringContaining('[TestContext]'),
            'test message'
        );
    });

    it('should log warning messages', () => {
        const logger = createLogger('TestContext');
        logger.warn('warning message');

        expect(consoleSpy.warn).toHaveBeenCalledWith(
            expect.stringContaining('[TestContext]'),
            'warning message'
        );
    });

    it('should log error messages', () => {
        const logger = createLogger('TestContext');
        const error = new Error('test error');
        logger.error('error message', error);

        expect(consoleSpy.error).toHaveBeenCalledWith(
            expect.stringContaining('[TestContext]'),
            'error message',
            error
        );
    });

    it('should log debug messages', () => {
        const logger = createLogger('TestContext');
        logger.debug('debug message');

        expect(consoleSpy.debug).toHaveBeenCalledWith(
            expect.stringContaining('[TestContext]'),
            'debug message'
        );
    });

    it('createContextLogger should be an alias for createLogger', () => {
        const logger = createContextLogger('AliasContext');
        logger.info('alias message');

        expect(consoleSpy.info).toHaveBeenCalledWith(
            expect.stringContaining('[AliasContext]'),
            'alias message'
        );
    });
});
