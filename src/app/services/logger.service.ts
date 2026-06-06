import { Injectable } from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly logHistory: LogEntry[] = [];
  private readonly maxHistorySize = 100;
  private currentLogLevel: LogLevel = LogLevel.INFO;

  constructor() {
    this.loadLogLevel();
  }

  /**
   * Set the minimum log level to display
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
    sessionStorage.setItem('logLevel', level.toString());
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: any, context?: string): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    this.log(LogLevel.ERROR, message, context, errorData);
  }

  /**
   * Get log history
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory.length = 0;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Private log method
   */
  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (level < this.currentLogLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: context || 'General',
      data
    };

    this.logHistory.push(entry);

    // Maintain max history size
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    this.printToConsole(entry);
  }

  /**
   * Print to browser console
   */
  private printToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.context}]`;

    const consoleMethod = this.getConsoleMethod(entry.level);
    if (entry.data) {
      consoleMethod(`${prefix} ${entry.message}`, entry.data);
    } else {
      consoleMethod(`${prefix} ${entry.message}`);
    }
  }

  /**
   * Get appropriate console method based on log level
   */
  private getConsoleMethod(level: LogLevel): any {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Load log level from storage
   */
  private loadLogLevel(): void {
    const saved = sessionStorage.getItem('logLevel');
    if (saved) {
      this.currentLogLevel = parseInt(saved, 10);
    }
  }
}
