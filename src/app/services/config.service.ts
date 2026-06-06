import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Application configuration service
 * Centralized configuration management for the application
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  /**
   * API configuration
   */
  readonly api = {
    baseUrl: environment.apiUrl,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  };

  /**
   * Authentication configuration
   */
  readonly auth = {
    tokenKey: 'auth_token',
    userKey: 'current_user',
    tokenExpiration: 3600000, // 1 hour
    refreshThreshold: 300000 // 5 minutes before expiration
  };

  /**
   * UI configuration
   */
  readonly ui = {
    toastDuration: 3000,
    toastErrorDuration: 4000,
    animationDuration: 300,
    pageSize: 20,
    maxUploadSize: 5242880 // 5MB in bytes
  };

  /**
   * Feature flags
   */
  readonly features = {
    emailNotifications: true,
    twoFactorAuth: false,
    socialLogin: false,
    darkMode: true,
    advancedReports: true
  };

  /**
   * Validation rules
   */
  readonly validation = {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    phonePattern: /^[\d\s\-\+\(\)]+$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  };

  /**
   * Storage configuration
   */
  readonly storage = {
    prefix: 'raffle_',
    useSessionStorage: false,
    compressionEnabled: false
  };

  /**
   * Logging configuration
   */
  readonly logging = {
    enableConsole: !environment.production,
    enableRemote: environment.production,
    remoteUrl: `${environment.apiUrl}/Logs`,
    maxHistorySize: 100
  };

  /**
   * Cache configuration
   */
  readonly cache = {
    giftsCacheDuration: 600000, // 10 minutes
    userCacheDuration: 1800000, // 30 minutes
    ordersCacheDuration: 300000 // 5 minutes
  };

  /**
   * Pagination defaults
   */
  readonly pagination = {
    defaultPageSize: 20,
    defaultPage: 1,
    maxPageSize: 100
  };

  constructor() {
    this.validateConfiguration();
  }

  /**
   * Get a configuration value by path
   */
  get<T>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this;

    for (const key of keys) {
      value = value?.[key];
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName: keyof typeof this.features): boolean {
    return this.features[featureName];
  }

  /**
   * Validate password according to configured rules
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.validation.passwordMinLength) {
      errors.push(`הסיסמה חייבת להיות לפחות ${this.validation.passwordMinLength} תווים`);
    }

    if (this.validation.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('הסיסמה חייבת להכיל אות גדולה לפחות');
    }

    if (this.validation.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('הסיסמה חייבת להכיל ספרה לפחות');
    }

    if (this.validation.passwordRequireSpecialChars && !/[!@#$%^&*]/.test(password)) {
      errors.push('הסיסמה חייבת להכיל תו מיוחד לפחות');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email according to configured rules
   */
  validateEmail(email: string): boolean {
    return this.validation.emailPattern.test(email);
  }

  /**
   * Validate phone according to configured rules
   */
  validatePhone(phone: string): boolean {
    return this.validation.phonePattern.test(phone);
  }

  /**
   * Get storage key with prefix
   */
  getStorageKey(key: string): string {
    return `${this.storage.prefix}${key}`;
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    if (!this.api.baseUrl) {
      console.error('API base URL is not configured');
    }

    if (this.validation.passwordMinLength < 6) {
      console.warn('Password minimum length is less than 6 characters');
    }
  }
}
