import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authenticateToken,
  generateToken,
  requireRole,
  verifyToken,
  type AuthPayload,
} from '../server/auth.ts';
import { calculateDistanceKm } from '../server/db.ts';

const payload: AuthPayload = {
  id: 42,
  email: 'provider@example.com',
  role: 'provider',
  full_name: 'Test Provider',
};

function responseMock() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.body = body;
      return response;
    },
  };
  return response;
}

test('generateToken and verifyToken round-trip the auth payload', () => {
  const token = generateToken(payload);

  const verifiedPayload = verifyToken(token);
  assert.deepEqual(
    {
      id: verifiedPayload.id,
      email: verifiedPayload.email,
      role: verifiedPayload.role,
      full_name: verifiedPayload.full_name,
    },
    payload
  );
  assert.equal(typeof (verifiedPayload as AuthPayload & { exp: number }).exp, 'number');
});

test('verifyToken rejects a tampered token', () => {
  const token = generateToken(payload);

  assert.throws(() => verifyToken(`${token}tampered`));
});

test('authenticateToken rejects requests without a Bearer token', () => {
  const request = { headers: {} } as never;
  const response = responseMock();
  let nextCalled = false;

  authenticateToken(request, response as never, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, {
    error: 'Authentication required. Missing or invalid Bearer token.',
  });
  assert.equal(nextCalled, false);
});

test('authenticateToken attaches a valid user and calls next', () => {
  const token = generateToken(payload);
  const request = { headers: { authorization: `Bearer ${token}` } } as {
    headers: { authorization: string };
    user?: AuthPayload;
  };
  const response = responseMock();
  let nextCalled = false;

  authenticateToken(request as never, response as never, () => {
    nextCalled = true;
  });

  assert.deepEqual(
    {
      id: request.user?.id,
      email: request.user?.email,
      role: request.user?.role,
      full_name: request.user?.full_name,
    },
    payload
  );
  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, 200);
});

test('requireRole rejects users with an unauthorized role', () => {
  const request = { user: { ...payload, role: 'customer' } } as never;
  const response = responseMock();
  let nextCalled = false;

  requireRole('provider')(request, response as never, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    error: "Forbidden: Access restricted to [provider]. Your role is 'customer'",
  });
  assert.equal(nextCalled, false);
});

test('requireRole allows users with an authorized role', () => {
  const request = { user: payload } as never;
  const response = responseMock();
  let nextCalled = false;

  requireRole('provider')(request, response as never, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, 200);
});

test('calculateDistanceKm returns zero for identical coordinates', () => {
  assert.equal(calculateDistanceKm(22.8456, 89.5403, 22.8456, 89.5403), 0);
});

test('calculateDistanceKm calculates a rounded geographic distance', () => {
  assert.equal(calculateDistanceKm(0, 0, 0, 1), 111.2);
});