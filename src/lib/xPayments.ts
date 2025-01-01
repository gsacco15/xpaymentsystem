export interface PaymentConfig {
  apiKey: string;
  mode: 'test' | 'live';
  currency?: string;
  locale?: string;
  environment?: 'sandbox' | 'production';
  debug?: boolean;
  retryConfig?: RetryConfig;
  rateLimit?: RateLimitConfig;
}

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  customer?: {
    email?: string;
    name?: string;
    id?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  paymentMethod?: {
    type: 'card' | 'bank_transfer' | 'crypto';
    data?: Record<string, any>;
  };
}

export interface PaymentResponse {
  id: string;
  status: 'succeeded' | 'failed' | 'pending' | 'processing';
  amount: number;
  currency: string;
  description?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  customer?: {
    email?: string;
    name?: string;
    id?: string;
  };
  paymentMethod?: {
    type: string;
    last4?: string;
    brand?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export type PaymentErrorCode = 
  | 'INVALID_AMOUNT'
  | 'INVALID_CURRENCY'
  | 'INVALID_API_KEY'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'CARD_DECLINED'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_CARD'
  | 'EXPIRED_CARD'
  | 'PROCESSING_ERROR'
  | 'AMOUNT_TOO_LARGE';

export class PaymentError extends Error {
  code: PaymentErrorCode;
  constructor(message: string, code: PaymentErrorCode) {
    super(message);
    this.code = code;
    this.name = 'PaymentError';
  }
}

export class XPayments {
  private static config: PaymentConfig;
  private static readonly VALID_CURRENCIES = ['USD', 'EUR', 'GBP'];
  private static rateLimitStore: Map<string, number[]> = new Map();

  static init(config: PaymentConfig) {
    if (!config.apiKey) {
      throw new PaymentError('API key is required', 'INVALID_API_KEY');
    }
    
    if (config.apiKey !== 'test_key_123' && config.mode === 'test') {
      throw new PaymentError('Invalid test API key', 'INVALID_API_KEY');
    }

    XPayments.config = {
      ...config,
      environment: config.environment || 'sandbox',
      debug: config.debug || false,
      retryConfig: {
        maxRetries: config.retryConfig?.maxRetries || 3,
        backoffMs: config.retryConfig?.backoffMs || 1000
      },
      rateLimit: {
        maxAttempts: config.rateLimit?.maxAttempts || 100,
        windowMs: config.rateLimit?.windowMs || 15 * 60 * 1000 // 15 minutes
      }
    };

    if (XPayments.config.debug) {
      console.log('XPayments initialized with config:', XPayments.config);
    }
  }

  private static validatePayment(request: PaymentRequest) {
    if (!request.amount || request.amount <= 0) {
      throw new PaymentError('Invalid amount', 'INVALID_AMOUNT');
    }

    if (!this.VALID_CURRENCIES.includes(request.currency)) {
      throw new PaymentError('Invalid currency', 'INVALID_CURRENCY');
    }

    if (request.amount > 99999.99) {
      throw new PaymentError('Amount exceeds maximum limit', 'AMOUNT_TOO_LARGE');
    }

    // Validate customer email if provided
    if (request.customer?.email && !this.isValidEmail(request.customer.email)) {
      throw new PaymentError('Invalid email address', 'INVALID_CARD');
    }
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private static generatePaymentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `pay_${timestamp}${random}`;
  }

  private static async simulateNetworkDelay(): Promise<void> {
    if (this.config.debug) {
      console.log('Simulating network delay...');
    }
    const delay = Math.random() * 1000 + 500; // Random delay between 500-1500ms
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private static shouldSimulateError(): boolean {
    // Simulate random errors 10% of the time in test mode
    return XPayments.config.mode === 'test' && Math.random() < 0.1;
  }

  private static checkRateLimit(key: string): boolean {
    const now = Date.now();
    const windowMs = this.config.rateLimit?.windowMs || 15 * 60 * 1000;
    const maxAttempts = this.config.rateLimit?.maxAttempts || 100;

    let attempts = this.rateLimitStore.get(key) || [];
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (attempts.length >= maxAttempts) {
      return false;
    }

    attempts.push(now);
    this.rateLimitStore.set(key, attempts);
    return true;
  }

  private static async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    const maxRetries = this.config.retryConfig?.maxRetries || 3;
    const backoffMs = this.config.retryConfig?.backoffMs || 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (this.config.debug) {
          console.log(`Attempt ${attempt + 1} failed:`, error);
        }
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError;
  }

  static async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.checkRateLimit('create_payment')) {
      throw new PaymentError('Too many requests', 'RATE_LIMITED');
    }

    return this.withRetry(async () => {
      // Simulate network delay
      await this.simulateNetworkDelay();

      // Validate the request
      this.validatePayment(request);

      // Simulate random errors in test mode
      if (this.shouldSimulateError()) {
        const errors = [
          { message: 'Network error', code: 'NETWORK_ERROR' as PaymentErrorCode },
          { message: 'Card declined', code: 'CARD_DECLINED' as PaymentErrorCode },
          { message: 'Insufficient funds', code: 'INSUFFICIENT_FUNDS' as PaymentErrorCode },
          { message: 'Invalid card', code: 'INVALID_CARD' as PaymentErrorCode },
          { message: 'Card expired', code: 'EXPIRED_CARD' as PaymentErrorCode }
        ];
        const error = errors[Math.floor(Math.random() * errors.length)];
        throw new PaymentError(error.message, error.code);
      }

      // Process successful payment
      const now = new Date().toISOString();
      return {
        id: this.generatePaymentId(),
        status: 'succeeded',
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        created_at: now,
        updated_at: now,
        metadata: request.metadata,
        customer: request.customer,
        paymentMethod: request.paymentMethod && {
          type: request.paymentMethod.type,
          last4: '4242', // Simulated card last4
          brand: 'visa'  // Simulated card brand
        }
      };
    });
  }

  static async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    if (!this.checkRateLimit('get_status')) {
      throw new PaymentError('Too many requests', 'RATE_LIMITED');
    }

    return this.withRetry(async () => {
      await this.simulateNetworkDelay();
      
      if (!paymentId.startsWith('pay_')) {
        throw new PaymentError('Invalid payment ID', 'PROCESSING_ERROR');
      }

      // Simulate different payment statuses
      const statuses: Array<PaymentResponse['status']> = ['succeeded', 'processing', 'pending'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        id: paymentId,
        status: randomStatus,
        amount: 0,
        currency: 'USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  }

  // Test helpers
  static resetRateLimits(): void {
    this.rateLimitStore.clear();
  }

  static getConfig(): PaymentConfig {
    return { ...this.config };
  }
}