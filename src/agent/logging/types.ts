export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogEntry {
  level: LogLevel
  timestamp: number
  module: string
  message: string
  context?: Record<string, unknown>
  error?: Error
}

export interface LoggerConfig {
  level: LogLevel
  enableTimestamp: boolean
  enableModuleName: boolean
}

export interface Logger {
  debug(module: string, message: string, context?: Record<string, unknown>): void
  info(module: string, message: string, context?: Record<string, unknown>): void
  warn(module: string, message: string, context?: Record<string, unknown>): void
  error(module: string, message: string, error?: Error, context?: Record<string, unknown>): void
  setLevel(level: LogLevel): void
  getConfig(): LoggerConfig
}
