const { CircuitBreaker } = require('../src/services/circuitBreaker');

describe('CircuitBreaker', () => {
  test('opens after reaching failure threshold', async () => {
    const breaker = new CircuitBreaker({
      threshold: 2,
      cooldownMs: 60_000,
    });

    const failingCall = jest.fn().mockRejectedValue(new Error('Gemini down'));

    await expect(breaker.execute(failingCall)).rejects.toThrow('Gemini down');
    await expect(breaker.execute(failingCall)).rejects.toThrow('Gemini down');

    expect(breaker.getState()).toEqual({
      state: 'open',
      failures: 2,
    });

    const blockedCall = jest.fn().mockResolvedValue('should not run');

    await expect(breaker.execute(blockedCall)).rejects.toThrow(
      /AI service is temporarily unavailable/i
    );

    expect(blockedCall).not.toHaveBeenCalled();
  });

  test('resets after successful call', async () => {
    const breaker = new CircuitBreaker({
      threshold: 2,
      cooldownMs: 60_000,
    });

    const successCall = jest.fn().mockResolvedValue('ok');

    const result = await breaker.execute(successCall);

    expect(result).toBe('ok');
    expect(breaker.getState()).toEqual({
      state: 'closed',
      failures: 0,
    });
  });

  test('moves from open to half-open after cooldown and recovers on success', async () => {
    const breaker = new CircuitBreaker({
      threshold: 1,
      cooldownMs: 1000,
    });

    const failingCall = jest.fn().mockRejectedValue(new Error('Gemini down'));

    await expect(breaker.execute(failingCall)).rejects.toThrow('Gemini down');

    expect(breaker.getState().state).toBe('open');

    breaker.lastFailureTime = Date.now() - 2000;

    const successCall = jest.fn().mockResolvedValue('recovered');

    const result = await breaker.execute(successCall);

    expect(result).toBe('recovered');
    expect(breaker.getState()).toEqual({
      state: 'closed',
      failures: 0,
    });
  });
});