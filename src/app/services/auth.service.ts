import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, LoginDTO } from '../models';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';
import { ConfigService } from './config.service';

export interface AuthResponse {
  token: string;
  user?: User;
  message?: string;
}

/**
 * Authentication service
 * Handles user authentication, token management, and session persistence
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly config = inject(ConfigService);
  private readonly apiUrl = `${environment.apiUrl}/Account`;
  
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();
  private readonly currentUserSignal = signal<User | null>(null);
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticatedSignal = computed(() => !!this.getToken());

  constructor() {
    this.loadUserFromStorage();
    this.logger.info('AuthService initialized', undefined, 'AuthService');
  }

  /**
   * Register a new user
   */
  register(user: User): Observable<AuthResponse> {
    this.logger.debug('Attempting user registration', { email: user.email }, 'AuthService');
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, user)
      .pipe(
        tap(response => {
          this.logger.info('User registered successfully', { email: user.email }, 'AuthService');
          this.setSession(response);
        }),
        catchError(error => {
          this.logger.error('Registration failed', error, 'AuthService');
          return throwError(() => this.handleAuthError(error));
        })
      );
  }

  /**
   * Login with credentials
   */
  login(credentials: LoginDTO): Observable<AuthResponse> {
    this.logger.debug('Attempting user login', { email: credentials.email }, 'AuthService');
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            this.logger.info('User logged in successfully', { email: credentials.email }, 'AuthService');
            this.setSession(response);
          }
        }),
        catchError(error => {
          this.logger.error('Login failed', error, 'AuthService');
          return throwError(() => this.handleAuthError(error));
        })
      );
  }

  /**
   * Logout current user
   */
  logout(): void {
    const currentUser = this.getCurrentUser();
    this.logger.info('User logout', { email: currentUser?.email }, 'AuthService');
    
    localStorage.removeItem(this.config.auth.tokenKey);
    localStorage.removeItem(this.config.auth.userKey);
    this.setCurrentUser(null);
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.config.auth.tokenKey);
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Admin' || user?.role === 'Manager';
  }

  /**
   * Set session after successful authentication
   */
  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(this.config.auth.tokenKey, authResponse.token);
    
    if (authResponse.user) {
      localStorage.setItem(this.config.auth.userKey, JSON.stringify(authResponse.user));
      this.setCurrentUser(authResponse.user);
    } else {
      const payload = this.parseJwtPayload(authResponse.token);
      const user = this.extractUserFromJWT(payload);
      localStorage.setItem(this.config.auth.userKey, JSON.stringify(user));
      this.setCurrentUser(user);
    }
  }

  /**
   * Extract user information from JWT payload
   */
  private extractUserFromJWT(payload: Record<string, unknown>): User {
    const userIdStr = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
      || payload['sub'] 
      || payload['nameid'] 
      || payload['userId'] 
      || payload['id'];
    
    const userId = userIdStr ? parseInt(String(userIdStr), 10) : undefined;
    
    return {
      id: Number.isFinite(userId) ? userId : undefined,
      name: String(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] 
        || payload['name'] 
        || payload['unique_name'] 
        || 'משתמש'),
      email: String(payload['email'] || payload['sub'] || 'user@example.com'),
      phone: '',
      password: '',
      role: String(payload['role'] 
        || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
        || 'Customer')
    };
  }

  /**
   * Parse JWT token payload
   */
  private parseJwtPayload(token: string): Record<string, unknown> {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Invalid token format');
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      this.logger.error('Failed to parse JWT payload', error, 'AuthService');
      return {};
    }
  }

  /**
   * Load user from local storage on initialization
   */
  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem(this.config.auth.userKey);
    
    if (token && userJson && userJson !== 'undefined') {
      try {
        const user = JSON.parse(userJson) as User;
        this.setCurrentUser(user);
        this.logger.debug('User loaded from storage', { email: user.email }, 'AuthService');
      } catch (error) {
        this.logger.error('Failed to load user from storage', error, 'AuthService');
        localStorage.removeItem(this.config.auth.tokenKey);
        localStorage.removeItem(this.config.auth.userKey);
      }
    }
  }

  /**
   * Update current user state
   */
  private setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
    this.currentUserSubject.next(user);
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): Error {
    if (error.status === 401 || error.status === 403) {
      return new Error('שם משתמש או סיסמה שגויים');
    }
    if (error.status === 409) {
      return new Error('כתובת דוא"ל זו כבר קיימת במערכת');
    }
    if (error.status >= 500) {
      return new Error('שגיאת שרת. אנא נסה שוב מאוחר יותר');
    }
    return new Error(error.error?.message || 'שגיאה בתהליך האימות');
  }
}
