import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, GiftService, AuthService } from '../../services';
import { ToastService } from '../../services/toast.service';
import { LoggerService } from '../../services/logger.service';
import { EmailService } from '../../services/email.service';
import { Gift, OrderItem } from '../../models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface CartItemWithGift {
  orderItem: OrderItem;
  gift: Gift;
  total: number;
}

/**
 * Shopping cart component
 * Displays cart items, allows modification, and processes purchases
 */
@Component({
  selector: 'app-cart',
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit, OnDestroy {
  cartItems: CartItemWithGift[] = [];
  totalAmount = 0;
  isLoading = false;
  
  private readonly orderService = inject(OrderService);
  private readonly giftService = inject(GiftService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly emailService = inject(EmailService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.logger.debug('Cart component initialized', undefined, 'Cart');
    this.loadCartItems();
  }

  ngOnDestroy(): void {
    this.logger.debug('Cart component destroyed', undefined, 'Cart');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load cart items and calculate total
   */
  loadCartItems(): void {
    try {
      const cart = this.orderService.getCart();
      
      if (cart.length === 0) {
        this.cartItems = [];
        this.totalAmount = 0;
        this.isLoading = false;
        return;
      }

      this.cartItems = cart.map(orderItem => {
        const gift = (orderItem as any).giftData || this.createDefaultGift(orderItem.giftId);
        return {
          orderItem,
          gift,
          total: gift.ticketPrice * orderItem.quantity
        };
      });
      
      this.calculateTotal();
      this.logger.debug('Cart items loaded', { count: this.cartItems.length }, 'Cart');
    } catch (error) {
      this.logger.error('Failed to load cart items', error, 'Cart');
      this.toastService.error('שגיאה בטעינת סל הקניות');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Remove item from cart
   */
  removeFromCart(giftId: number): void {
    try {
      const giftName = this.cartItems.find(item => item.gift.id === giftId)?.gift.name || 'מתנה';
      const confirmed = confirm(`האם אתה בטוח שברצונך להסיר את "${giftName}" מהסל?`);
      
      if (confirmed) {
        this.orderService.removeFromCart(giftId);
        this.loadCartItems();
        this.logger.info(`Item removed from cart: ${giftName}`, undefined, 'Cart');
        this.toastService.success(`"${giftName}" הוסרה מהסל`);
      }
    } catch (error) {
      this.logger.error('Failed to remove item from cart', error, 'Cart');
      this.toastService.error('שגיאה בהסרת פריט מהסל');
    }
  }

  /**
   * Update item quantity
   */
  updateQuantity(giftId: number, value: any): void {
    try {
      const quantity = parseInt(value, 10);
      
      if (isNaN(quantity) || quantity <= 0) {
        this.removeFromCart(giftId);
        return;
      }
      
      this.orderService.removeFromCart(giftId);
      this.orderService.addToCart(giftId, quantity);
      this.loadCartItems();
      this.logger.debug(`Quantity updated for gift ${giftId}`, { quantity }, 'Cart');
    } catch (error) {
      this.logger.error('Failed to update quantity', error, 'Cart');
      this.toastService.error('שגיאה בעדכון כמות');
    }
  }

  /**
   * Confirm purchase and place order
   */
  confirmPurchase(): void {
    try {
      if (this.cartItems.length === 0) {
        this.toastService.warning('סל הקניות ריק');
        return;
      }

      const user = this.authService.getCurrentUser();
      if (!user) {
        this.toastService.warning('עליך להתחבר כדי לבצע רכישה');
        return;
      }
      
      const userId = this.extractUserId(user);
      if (!userId) {
        this.logger.error('Unable to extract user ID', { user }, 'Cart');
        this.toastService.error('שגיאה בזיהוי המשתמש');
        return;
      }

      this.isLoading = true;
      this.logger.info('Processing purchase', { userId, totalAmount: this.totalAmount }, 'Cart');
      
      this.orderService.confirmOrder(userId, this.totalAmount)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.handlePurchaseSuccess(user);
          },
          error: (error) => {
            this.handlePurchaseError(error);
          }
        });
    } catch (error) {
      this.logger.error('Error in purchase confirmation', error, 'Cart');
      this.toastService.error('שגיאה בתהליך הרכישה');
      this.isLoading = false;
    }
  }

  /**
   * Calculate total amount
   */
  private calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce((sum, item) => sum + item.total, 0);
  }

  /**
   * Get total number of tickets
   */
  getTotalTickets(): number {
    return this.cartItems.reduce((sum, item) => sum + item.orderItem.quantity, 0);
  }

  /**
   * Create default gift when data is missing
   */
  private createDefaultGift(giftId: number): Gift {
    return {
      id: giftId,
      name: `מתנה #${giftId}`,
      description: 'תיאור זמני',
      ticketPrice: 50,
      category: 'כללי',
      donorName: 'תורם אנונימי'
    };
  }

  /**
   * Extract user ID from user object
   */
  private extractUserId(user: any): number | null {
    if (user.id && !isNaN(user.id)) {
      return user.id;
    }
    if (user.email && !isNaN(parseInt(user.email, 10))) {
      return parseInt(user.email, 10);
    }
    return null;
  }

  /**
   * Handle successful purchase
   */
  private handlePurchaseSuccess(user: any): void {
    try {
      const orderNumber = `ORD-${Date.now()}`;
      
      this.orderService.clearCart();
      this.toastService.success('הרכישה אושרה בהצלחה!');
      
      // Send confirmation email
      if (user.email) {
        this.emailService.sendOrderConfirmation(
          user.email,
          orderNumber,
          this.totalAmount,
          this.cartItems.map(item => ({
            name: item.gift.name,
            quantity: item.orderItem.quantity,
            price: item.gift.ticketPrice
          }))
        ).pipe(takeUntil(this.destroy$))
         .subscribe({
          next: () => {
            this.logger.info('Confirmation email sent', { email: user.email }, 'Cart');
          },
          error: (error) => {
            this.logger.warn('Failed to send confirmation email', error, 'Cart');
          }
        });
      }
      
      this.logger.info('Purchase completed successfully', { orderNumber, amount: this.totalAmount }, 'Cart');
      
      setTimeout(() => {
        this.loadCartItems();
        this.isLoading = false;
        this.cdr.markForCheck();
      }, 500);
    } catch (error) {
      this.logger.error('Error handling purchase success', error, 'Cart');
      this.toastService.error('خطأ في معالجة الرد على الشراء');
      this.isLoading = false;
    }
  }

  /**
   * Handle purchase error
   */
  private handlePurchaseError(error: any): void {
    this.isLoading = false;
    this.logger.error('Purchase failed', error, 'Cart');
    
    let errorMessage = 'شگיאה באישור הרכישה';
    
    if (error.status === 400) {
      errorMessage = 'נתונים לא תקינים';
    } else if (error.status === 401) {
      errorMessage = 'נדרשת התחברות מחדש';
    } else if (error.status === 402) {
      errorMessage = 'יתרה לא מספיקה';
    } else if (error.status === 409) {
      errorMessage = 'קונפליקט בעדכון המחסן';
    } else if (error.status >= 500) {
      errorMessage = 'שגיאת שרת. אנא נסה שוב מאוחר יותר';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    this.toastService.error(errorMessage);
    this.cdr.markForCheck();
  }
}
