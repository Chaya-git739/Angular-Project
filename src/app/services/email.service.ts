import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

/**
 * Email notification types
 */
export enum EmailType {
  WELCOME = 'welcome',
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_SHIPPED = 'order_shipped',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_VERIFICATION = 'account_verification',
  RAFFLE_WINNER = 'raffle_winner',
  PROMOTIONAL = 'promotional'
}

/**
 * Email request payload
 */
export interface EmailRequest {
  to: string;
  subject: string;
  template: EmailType;
  variables?: Record<string, any>;
  cc?: string[];
  bcc?: string[];
}

/**
 * Email response
 */
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  timestamp?: Date;
}

/**
 * Email service for sending notifications
 * 
 * This service handles all email communications including:
 * - Order confirmations
 * - Welcome emails
 * - Password reset
 * - Raffle winner notifications
 * - Promotional emails
 */
@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly apiUrl = `${environment.apiUrl}/Email`;

  /**
   * Send a welcome email to new user
   */
  sendWelcomeEmail(email: string, name: string): Observable<EmailResponse> {
    return this.sendEmail(
      email,
      'ברוכים הבאים לאתר ההגרלה',
      EmailType.WELCOME,
      { name }
    );
  }

  /**
   * Send order confirmation email
   */
  sendOrderConfirmation(
    email: string,
    orderNumber: string,
    totalAmount: number,
    items: Array<{ name: string; quantity: number; price: number }>
  ): Observable<EmailResponse> {
    return this.sendEmail(
      email,
      'אישור הזמנה',
      EmailType.ORDER_CONFIRMATION,
      {
        orderNumber,
        totalAmount,
        items,
        date: new Date().toLocaleDateString('he-IL')
      }
    );
  }

  /**
   * Send order shipped notification
   */
  sendOrderShipped(
    email: string,
    orderNumber: string,
    trackingNumber?: string
  ): Observable<EmailResponse> {
    return this.sendEmail(
      email,
      'ההזמנה שלך נשלחה',
      EmailType.ORDER_SHIPPED,
      { orderNumber, trackingNumber }
    );
  }

  /**
   * Send password reset email
   */
  sendPasswordReset(email: string, resetLink: string): Observable<EmailResponse> {
    return this.sendEmail(
      email,
      'איפוס סיסמה',
      EmailType.PASSWORD_RESET,
      { resetLink }
    );
  }

  /**
   * Send account verification email
   */
  sendAccountVerification(email: string, verificationLink: string): Observable<EmailResponse> {
    return this.sendEmail(
      email,
      'אימות חשבון',
      EmailType.ACCOUNT_VERIFICATION,
      { verificationLink }
    );
  }

  /**
   * Send raffle winner notification
   */
  sendRaffleWinner(
    email: string,
    name: string,
    prizeDescription: string,
    winningAmount?: number
  ): Observable<EmailResponse> {
    return this.sendEmail(
      email,
      'ברכה! אתה זכית בהגרלה!',
      EmailType.RAFFLE_WINNER,
      { name, prizeDescription, winningAmount }
    );
  }

  /**
   * Send promotional email
   */
  sendPromotionalEmail(
    email: string,
    subject: string,
    content: Record<string, any>
  ): Observable<EmailResponse> {
    return this.sendEmail(email, subject, EmailType.PROMOTIONAL, content);
  }

  /**
   * Generic email sending method
   */
  private sendEmail(
    to: string,
    subject: string,
    template: EmailType,
    variables?: Record<string, any>
  ): Observable<EmailResponse> {
    if (!this.isValidEmail(to)) {
      this.logger.error('Invalid email address', { email: to }, 'EmailService');
      return throwError(() => new Error('כתובת דוא"ל לא חוקית'));
    }

    const request: EmailRequest = {
      to,
      subject,
      template,
      variables
    };

    this.logger.debug(`Sending email to ${to}`, { template, subject }, 'EmailService');

    return new Observable(observer => {
      this.http.post<EmailResponse>(`${this.apiUrl}/send`, request).subscribe({
        next: (response) => {
          this.logger.info(`Email sent successfully to ${to}`, { messageId: response.messageId }, 'EmailService');
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          this.logger.error(`Failed to send email to ${to}`, error, 'EmailService');
          observer.error(this.handleEmailError(error));
        }
      });
    });
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Handle email errors gracefully
   */
  private handleEmailError(error: any): Error {
    if (error.status === 400) {
      return new Error('פרטי הדוא"ל שלך לא תקינים');
    }
    if (error.status === 409) {
      return new Error('כתובת זו כבר קיימת במערכת');
    }
    if (error.status >= 500) {
      return new Error('שגיאת שרת. אנא נסה שוב מאוחר יותר');
    }
    return new Error(error.error?.message || 'שליחת הדוא"ל נכשלה');
  }
}
