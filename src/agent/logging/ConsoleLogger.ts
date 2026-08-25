import { LogLevel, type LogEntry, type Logger, type LoggerConfig } from './types'

export class ConsoleLogger implements Logger {
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableTimestamp: true,
      enableModuleName: true,
      ...config
    }
  }

  debug(module: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, module, message, undefined, context)
  }

  info(module: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, module, message, undefined, context)
  }

  warn(module: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, module, message, undefined, context)
  }

  error(module: string, message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, module, message, error, context)
  }

  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  getConfig(): LoggerConfig {
    return { ...this.config }
  }

  private log(
    level: LogLevel,
    module: string,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    if (level < this.config.level) {
      return
    }

    const entry: LogEntry = {
      level,
      timestamp: Date.now(),
      module,
      message,
      context,
      error
    }

    const formatted = this.format(entry)
    this.output(level, formatted, error)
  }

  private format(entry: LogEntry): string {
    const parts: string[] = []

    if (this.config.enableTimestamp) {
      const time = new Date(entry.timestamp).toISOString()
      parts.push(`[${time}]`)
    }

    parts.push(`[${LogLevel[entry.level]}]`)

    if (this.config.enableModuleName) {
      parts.push(`[${entry.module}]`)
    }

    parts.push(entry.message)

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context))
    }

    return parts.join(' ')
  }

  private output(level: LogLevel, formatted: string, error?: Error): void {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted)
        break
      case LogLevel.INFO:
        console.info(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.ERROR:
        console.error(formatted, error || '')
        break
    }
  }
}
