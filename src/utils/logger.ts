type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

class Logger {
  private format(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  info(message: string, context?: any) {
    console.log(this.format('INFO', message, context));
  }

  warn(message: string, context?: any) {
    console.warn(this.format('WARN', message, context));
  }

  error(message: string, error?: any) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.format('ERROR', message, errorDetails));
  }

  debug(message: string, context?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format('DEBUG', message, context));
    }
  }
}

export const logger = new Logger();
