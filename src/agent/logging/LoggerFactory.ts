import { LogLevel, type Logger, type LoggerConfig } from './types'
import { ConsoleLogger } from './ConsoleLogger'

export class LoggerFactory {
  private static instance: Logger | null = null
  private static defaultConfig: Partial<LoggerConfig> = {
    level: LogLevel.INFO
  }

  static getLogger(): Logger {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new ConsoleLogger(LoggerFactory.defaultConfig)
    }
    return LoggerFactory.instance
  }

  static setLogger(logger: Logger): void {
    LoggerFactory.instance = logger
  }

  static configure(config: Partial<LoggerConfig>): void {
    LoggerFactory.defaultConfig = { ...LoggerFactory.defaultConfig, ...config }
    if (LoggerFactory.instance) {
      LoggerFactory.instance.setLevel(LoggerFactory.defaultConfig.level ?? LogLevel.INFO)
    }
  }

  static reset(): void {
    LoggerFactory.instance = null
    LoggerFactory.defaultConfig = { level: LogLevel.INFO }
  }
}

export function getLogger(): Logger {
  return LoggerFactory.getLogger()
}
