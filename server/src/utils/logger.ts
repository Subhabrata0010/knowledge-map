/**
 * Structured logging utility
 */

import { config } from '@/config';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

const logLevelPriority = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;

  constructor(level: string = 'info') {
    this.level = level as LogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return logLevelPriority[level] >= logLevelPriority[this.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): string {
    if (config.logging.enableStructured) {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
      });
    }
    return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message} ${
      meta ? JSON.stringify(meta) : ''
    }`;
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  error(message: string, error?: Error | any, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(
        this.formatMessage(LogLevel.ERROR, message, {
          ...meta,
          error: error?.message || error,
          stack: error?.stack,
        })
      );
    }
  }
}

export const logger = new Logger(config.logging.level);
