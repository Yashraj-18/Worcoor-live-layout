import crypto from 'crypto';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { AuthService } from '../../src/modules/auth/service.js';
import type { AuthRepository } from '../../src/modules/auth/repository.js';
import { createMockReply, createMockRequest } from '../helpers/mocks.js';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(async (value: string) => `hashed-${value}`),
    compare: vi.fn(async (value: string, hash: string) => `hashed-${value}` === hash),
  },
}));

type AuthRepositoryMocks = {
  [K in keyof AuthRepository]: ReturnType<typeof vi.fn>;
};

function createRepositoryMock(): AuthRepositoryMocks {
  return {
    findUserByEmail: vi.fn(),
    createOrganization: vi.fn(),
    createUser: vi.fn(),
    setResetToken: vi.fn(),
    findByResetToken: vi.fn(),
    clearResetTokenAndUpdatePassword: vi.fn(),
  };
}

describe('AuthService', () => {
  let repository: AuthRepositoryMocks;
  let service: AuthService;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = 'test';
    repository = createRepositoryMock();
    service = new AuthService(repository as unknown as AuthRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('authenticates and responds with user + organization details', async () => {
      repository.findUserByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'worker@example.com',
        passwordHash: 'hashed-StrongPass1!',
        role: 'worker',
        organizationId: 'org-1',
        organizationName: 'Org One',
      });

      const request = createMockRequest({
        body: { email: 'worker@example.com', password: 'StrongPass1!' },
      });
      const reply = createMockReply();

      await service.login(request, reply);

      expect(reply.statusCode).toBe(200);
      expect(reply.payload).toEqual({
        user: { id: 'user-1', email: 'worker@example.com', role: 'worker' },
        organization: { id: 'org-1', name: 'Org One' },
      });
      expect(reply.setCookie).toHaveBeenCalledWith(
        'token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('returns 401 when credentials are invalid', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      const request = createMockRequest({
        body: { email: 'missing@example.com', password: 'bad' },
      });
      const reply = createMockReply();

      await service.login(request, reply);

      expect(reply.statusCode).toBe(401);
      expect(reply.payload).toEqual({ error: 'Invalid credentials' });
    });
  });

  describe('register', () => {
    it('rejects duplicate emails', async () => {
      repository.findUserByEmail.mockResolvedValue({} as never);
      const request = createMockRequest({
        body: { organizationName: 'New Org', email: 'dup@example.com', password: 'Secret123!' },
      });
      const reply = createMockReply();

      await service.register(request, reply);

      expect(reply.statusCode).toBe(409);
      expect(reply.payload).toEqual({ error: 'Email is already registered' });
    });

    it('creates organization and admin user then sets auth cookie', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      const uuidSpy = vi.spyOn(crypto, 'randomUUID');
      uuidSpy
        .mockReturnValueOnce('11111111-1111-1111-1111-111111111111')
        .mockReturnValueOnce('22222222-2222-2222-2222-222222222222');

      const request = createMockRequest({
        body: { organizationName: 'Acme', email: 'admin@acme.com', password: 'AdminPass123!' },
      });
      const reply = createMockReply();

      await service.register(request, reply);

      expect(repository.createOrganization).toHaveBeenCalledWith({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Acme',
      });
      expect(repository.createUser).toHaveBeenCalledWith({
        id: '22222222-2222-2222-2222-222222222222',
        organizationId: '11111111-1111-1111-1111-111111111111',
        email: 'admin@acme.com',
        passwordHash: 'hashed-AdminPass123!',
        role: 'admin',
      });
      expect(reply.statusCode).toBe(201);
      expect(reply.payload).toEqual({
        user: {
          id: '22222222-2222-2222-2222-222222222222',
          email: 'admin@acme.com',
          role: 'admin',
        },
        organization: { id: '11111111-1111-1111-1111-111111111111', name: 'Acme' },
      });
      expect(reply.setCookie).toHaveBeenCalledWith(
        'token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('responds generically when user does not exist', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      const request = createMockRequest({ body: { email: 'ghost@example.com' } });
      const reply = createMockReply();

      await service.requestPasswordReset(request, reply);

      expect(reply.payload).toEqual({
        message: 'If the email exists, a reset link has been sent.',
      });
      expect(repository.setResetToken).not.toHaveBeenCalled();
    });

    it('stores hashed reset token and returns token in development', async () => {
      process.env.NODE_ENV = 'development';
      const fakeUser = { id: 'user-1' };
      repository.findUserByEmail.mockResolvedValue(fakeUser as never);
      const randomBytesSpy = vi
        .spyOn(crypto, 'randomBytes')
        .mockImplementation((size: number) => Buffer.alloc(size, 1));

      const request = createMockRequest({ body: { email: 'admin@example.com' } });
      const reply = createMockReply();

      await service.requestPasswordReset(request, reply);

      const tokenHex = randomBytesSpy.mock.results[0]?.value?.toString('hex');
      const expectedHash = crypto.createHash('sha256').update(tokenHex).digest('hex');

      expect(repository.setResetToken).toHaveBeenCalledWith(
        'user-1',
        expectedHash,
        expect.any(Date),
      );
      expect(reply.payload).toMatchObject({
        message: 'Password reset link generated.',
        resetToken: tokenHex,
      });
    });
  });

  describe('confirmPasswordReset', () => {
    it('rejects invalid or expired tokens', async () => {
      repository.findByResetToken.mockResolvedValue(null);
      const request = createMockRequest({
        body: { token: 'bad-token', newPassword: 'NewPass123!' },
      });
      const reply = createMockReply();

      await service.confirmPasswordReset(request, reply);
      expect(reply.statusCode).toBe(400);
      expect(reply.payload).toEqual({ error: 'Invalid or expired token' });
    });

    it('updates password and clears reset token', async () => {
      const token = 'valid-token';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      repository.findByResetToken.mockResolvedValue({
        id: 'user-1',
        resetTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 5),
      } as never);

      const request = createMockRequest({
        body: { token, newPassword: 'BrandNew123!' },
      });
      const reply = createMockReply();

      await service.confirmPasswordReset(request, reply);

      expect(repository.findByResetToken).toHaveBeenCalledWith(hashedToken);
      expect(repository.clearResetTokenAndUpdatePassword).toHaveBeenCalledWith(
        'user-1',
        'hashed-BrandNew123!',
      );
      expect(reply.payload).toEqual({ message: 'Password reset successfully' });
    });
  });
});
