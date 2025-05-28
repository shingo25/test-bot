const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  private currentLevel: number;

  constructor() {
    this.currentLevel = LOG_LEVELS[LOG_LEVEL as LogLevel] || LOG_LEVELS.info;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.currentLevel;
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log('[INFO]', new Date().toISOString(), ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', new Date().toISOString(), ...args);
    }
  }

  // 購入実行などの重要なイベント用
  purchase(...args: any[]): void {
    console.log('[PURCHASE]', new Date().toISOString(), ...args);
  }

  // ボット状態変更などの重要なイベント用
  bot(...args: any[]): void {
    console.log('[BOT]', new Date().toISOString(), ...args);
  }
}

export const logger = new Logger();