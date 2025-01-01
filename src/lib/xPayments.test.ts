import { XPayments, PaymentRequest, PaymentResponse, PaymentError } from './xPayments';

export class XPaymentsTestUtils {
  /**
   * Initialize XPayments in test mode
   */
  static initTestMode(debug: boolean = false) {
    XPayments.init({
      apiKey: 'test_key_123',
      mode: 'test',
      environment: 'sandbox',
      debug,
      retryConfig: {
        maxRetries: 2,
        backoffMs: 100
      },
      rateLimit: {
        maxAttempts: 10,
        windowMs: 1000 // 1 second for testing
      }
    });
  }

  /**
   * Create a test payment request
   */
  static createTestPaymentRequest(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
    return {
      amount: 99.99,
      currency: 'USD',
      description: 'Test payment',
      customer: {
        email: 'test@example.com',
        name: 'Test User'
      },
      metadata: {
        test: true,
        orderId: 'test_123'
      },
      ...overrides
    };
  }

  /**
   * Test different payment scenarios
   */
  static async testPaymentScenarios() {
    const scenarios = [
      // Test successful payment
      {
        name: 'Successful payment',
        request: this.createTestPaymentRequest(),
        expectSuccess: true
      },
      // Test invalid amount
      {
        name: 'Invalid amount',
        request: this.createTestPaymentRequest({ amount: -10 }),
        expectSuccess: false,
        expectedError: 'INVALID_AMOUNT'
      },
      // Test invalid currency
      {
        name: 'Invalid currency',
        request: this.createTestPaymentRequest({ currency: 'XXX' }),
        expectSuccess: false,
        expectedError: 'INVALID_CURRENCY'
      },
      // Test amount too large
      {
        name: 'Amount too large',
        request: this.createTestPaymentRequest({ amount: 100000 }),
        expectSuccess: false,
        expectedError: 'AMOUNT_TOO_LARGE'
      },
      // Test invalid email
      {
        name: 'Invalid email',
        request: this.createTestPaymentRequest({
          customer: { email: 'invalid-email', name: 'Test User' }
        }),
        expectSuccess: false,
        expectedError: 'INVALID_CARD'
      }
    ];

    const results: Array<{
      scenario: string;
      success: boolean;
      error?: string;
      response?: PaymentResponse;
    }> = [];

    for (const scenario of scenarios) {
      try {
        const response = await XPayments.createPayment(scenario.request);
        results.push({
          scenario: scenario.name,
          success: true,
          response
        });
      } catch (error) {
        results.push({
          scenario: scenario.name,
          success: false,
          error: (error as PaymentError).code
        });
      }
    }

    return results;
  }

  /**
   * Test rate limiting
   */
  static async testRateLimiting() {
    const request = this.createTestPaymentRequest();
    const results = [];

    // Try to make more requests than allowed
    for (let i = 0; i < 15; i++) {
      try {
        const response = await XPayments.createPayment(request);
        results.push({ success: true, response });
      } catch (error) {
        results.push({ success: false, error: (error as PaymentError).code });
      }
    }

    return results;
  }

  /**
   * Test retry mechanism
   */
  static async testRetryMechanism() {
    // Force a few failures to test retry
    const results = [];
    for (let i = 0; i < 5; i++) {
      try {
        const response = await XPayments.createPayment(this.createTestPaymentRequest());
        results.push({ attempt: i + 1, success: true, response });
      } catch (error) {
        results.push({ attempt: i + 1, success: false, error: (error as PaymentError).code });
      }
    }
    return results;
  }

  /**
   * Reset the test environment
   */
  static resetTestEnvironment() {
    XPayments.resetRateLimits();
  }
}

// Example usage:
/*
async function runTests() {
  XPaymentsTestUtils.initTestMode(true);
  
  console.log('Testing payment scenarios...');
  const scenarioResults = await XPaymentsTestUtils.testPaymentScenarios();
  console.log('Scenario results:', scenarioResults);

  console.log('Testing rate limiting...');
  const rateLimitResults = await XPaymentsTestUtils.testRateLimiting();
  console.log('Rate limit results:', rateLimitResults);

  console.log('Testing retry mechanism...');
  const retryResults = await XPaymentsTestUtils.testRetryMechanism();
  console.log('Retry results:', retryResults);
}

runTests().catch(console.error);
*/ 