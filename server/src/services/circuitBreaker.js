const logger = require('../utils/logger');

class CircuitBreaker {
  constructor(options = {}) {
    this.failureCount = 0;
    this.threshold = options.threshold || 3;
    this.cooldownMs = options.cooldownMs || 5 * 60 * 1000;
    this.state = 'closed';
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'open') {
      const cooldownFinished =
        Date.now() - this.lastFailureTime > this.cooldownMs;

      if (cooldownFinished) {
        this.state = 'half-open';
        logger.info({ action: 'circuit_breaker_half_open' });
      } else {
        const error = new Error(
          'AI service is temporarily unavailable. Please try again later.'
        );

        error.statusCode = 503;
        throw error;
      }
    }

    try {
      const result = await fn();

      if (this.state === 'half-open') {
        logger.info({ action: 'circuit_breaker_recovered' });
      }

      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  recordFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';

      logger.warn({
        action: 'circuit_breaker_open',
        failures: this.failureCount,
      });
    }
  }

  reset() {
    this.failureCount = 0;
    this.state = 'closed';
    this.lastFailureTime = null;
  }

  getState() {
    return {
      state: this.state,
      failures: this.failureCount,
    };
  }
}

module.exports = new CircuitBreaker();
module.exports.CircuitBreaker = CircuitBreaker;