import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { ConfigService } from './config.service';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  id?: string;
}

/**
 * Toast notification service
 * Provides methods for displaying temporary notifications
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastSubject = new Subject<Toast>();
  private readonly config = inject(ConfigService);
  readonly toast$ = this.toastSubject.asObservable();

  /**
   * Show a toast notification
   */
  show(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration?: number
  ): void {
    if (!message || message.trim().length === 0) {
      return;
    }

    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message: message.trim(),
      type,
      duration: duration || this.getDefaultDuration(type)
    };

    this.toastSubject.next(toast);
  }

  /**
   * Show success notification
   */
  success(message: string, duration?: number): void {
    this.show(message, 'success', duration || this.config.ui.toastDuration);
  }

  /**
   * Show error notification
   */
  error(message: string, duration?: number): void {
    this.show(message, 'error', duration || this.config.ui.toastErrorDuration);
  }

  /**
   * Show info notification
   */
  info(message: string, duration?: number): void {
    this.show(message, 'info', duration || this.config.ui.toastDuration);
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration || this.config.ui.toastDuration);
  }

  /**
   * Show confirmation dialog (browser native for now)
   */
  confirm(message: string): Promise<boolean> {
    return Promise.resolve(window.confirm(message));
  }

  /**
   * Get default duration based on type
   */
  private getDefaultDuration(type: string): number {
    switch (type) {
      case 'error':
        return this.config.ui.toastErrorDuration;
      case 'warning':
        return this.config.ui.toastDuration;
      case 'success':
        return this.config.ui.toastDuration;
      case 'info':
        return this.config.ui.toastDuration;
      default:
        return this.config.ui.toastDuration;
    }
  }
}
