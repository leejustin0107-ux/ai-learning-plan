const authenticate = require('../src/middleware/authenticate');
const errorHandler = require('../src/middleware/errorHandler');

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');

describe('authenticate middleware', () => {
  function mockReq(authHeader) {
    return {
      headers: authHeader
        ? {
            authorization: authHeader,
          }
        : {},
    };
  }

  function mockRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  }

  test('returns 401 when authorization header is missing', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is invalid', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req = mockReq('Bearer invalid-token');
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next when token is valid', () => {
    jwt.verify.mockReturnValue({
      userId: 'user-123',
    });

    const req = mockReq('Bearer valid-token');
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(req.user).toEqual({
      id: 'user-123',
    });

    expect(next).toHaveBeenCalled();
  });
});

describe('errorHandler middleware', () => {
  function mockReq() {
    return {
      requestId: 'req-123',
      originalUrl: '/test',
    };
  }

  function mockRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  }

  test('returns 500 for general error', () => {
    const err = new Error('Something failed');
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });

  test('uses custom statusCode when available', () => {
    const err = new Error('Bad request');
    err.statusCode = 400;

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad request',
    });
  });

  test('returns 400 for ZodError', () => {
    const err = {
      name: 'ZodError',
      message: 'Validation failed',
      errors: [{ path: ['email'], message: 'Invalid email' }],
    };

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid input',
      details: err.errors,
    });
  });

  test('returns 401 for UnauthorizedError', () => {
    const err = {
      name: 'UnauthorizedError',
      message: 'Missing token',
    };

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
    });
  });

  test('returns 401 for TokenExpiredError', () => {
    const err = {
      name: 'TokenExpiredError',
      message: 'jwt expired',
    };

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token has expired. Please log in again.',
    });
  });
});