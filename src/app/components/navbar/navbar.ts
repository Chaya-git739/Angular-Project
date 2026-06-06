import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../services/logger.service';

/**
 * Navigation bar component
 * Displays navigation and theme toggle
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private logger = inject(LoggerService);
  
  isDarkMode = signal(false);

  ngOnInit() {
    this.loadThemePreference();
    this.logger.debug('Navbar component initialized', undefined, 'Navbar');
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    try {
      this.isDarkMode.update(current => !current);
      this.applyTheme(this.isDarkMode());
      this.saveThemePreference();
      this.logger.debug('Theme toggled', { isDarkMode: this.isDarkMode() }, 'Navbar');
    } catch (error) {
      this.logger.error('Failed to toggle theme', error, 'Navbar');
    }
  }

  /**
   * Logout and navigate to login
   */
  onLogout(): void {
    try {
      this.authService.logout();
      this.logger.info('User logged out', undefined, 'Navbar');
      this.router.navigate(['/login']);
    } catch (error) {
      this.logger.error('Logout failed', error, 'Navbar');
    }
  }

  /**
   * Load theme preference from storage
   */
  private loadThemePreference(): void {
    try {
      const savedTheme = localStorage.getItem('theme');
      const isDarkMode = savedTheme === 'dark';
      this.isDarkMode.set(isDarkMode);
      
      if (isDarkMode) {
        this.applyTheme(true);
      }
      
      this.logger.debug('Theme preference loaded', { isDarkMode }, 'Navbar');
    } catch (error) {
      this.logger.error('Failed to load theme preference', error, 'Navbar');
    }
  }

  /**
   * Apply theme to the DOM
   */
  private applyTheme(isDark: boolean): void {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    if (isDark) {
      htmlElement.setAttribute('data-theme', 'dark');
      bodyElement.setAttribute('data-theme', 'dark');
      bodyElement.style.backgroundColor = '#111827';
      bodyElement.style.color = '#f9fafb';
    } else {
      htmlElement.removeAttribute('data-theme');
      bodyElement.removeAttribute('data-theme');
      bodyElement.style.backgroundColor = '';
      bodyElement.style.color = '';
    }
  }

  /**
   * Save theme preference to storage
   */
  private saveThemePreference(): void {
    try {
      const theme = this.isDarkMode() ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
    } catch (error) {
      this.logger.warn('Failed to save theme preference', error, 'Navbar');
    }
  }
}
