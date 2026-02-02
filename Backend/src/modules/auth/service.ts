import crypto from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';

import { JwtRole } from '../../plugins/auth.js';
import { AuthRepository } from './repository.js';
import {
  type ConfirmPasswordResetInput,
  type LoginInput,
  type RegisterInput,
  type RequestPasswordResetInput,
} from './schemas.js';

type LoginRequest = FastifyRequest<{ Body: LoginInput }>;
type RegisterRequest = FastifyRequest<{ Body: RegisterInput }>;
type RequestPasswordResetRequest = FastifyRequest<{ Body: RequestPasswordResetInput }>;
type ConfirmPasswordResetRequest = FastifyRequest<{ Body: ConfirmPasswordResetInput }>;

export class AuthService {
  private repository: AuthRepository;

  constructor(repository = new AuthRepository()) {
    this.repository = repository;
  }

  private async signAndSetCookie(
    reply: FastifyReply,
    payload: { userId: string; organizationId: string; role: JwtRole },
  ) {
    const token = await reply.jwtSign(payload);
    reply.setCookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  async login(request: LoginRequest, reply: FastifyReply) {
    const { email, password } = request.body;
    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    await this.signAndSetCookie(reply, {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      organization: {
        id: user.organizationId,
        name: user.organizationName,
      },
    };
  }

  async register(request: RegisterRequest, reply: FastifyReply) {
    const { organizationName, email, password } = request.body;

    const existingUser = await this.repository.findUserByEmail(email);
    if (existingUser) {
      return reply.status(409).send({ error: 'Email is already registered' });
    }

    const organizationId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await this.repository.createOrganization({ id: organizationId, name: organizationName });
    await this.repository.createUser({
      id: userId,
      organizationId,
      email,
      passwordHash,
      role: 'admin',
    });

    await this.signAndSetCookie(reply, { userId, organizationId, role: 'admin' });

    reply.code(201);
    return {
      user: { id: userId, email, role: 'admin' },
      organization: { id: organizationId, name: organizationName },
    };
  }

  async requestPasswordReset(request: RequestPasswordResetRequest, reply: FastifyReply) {
    const { email } = request.body;
    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.repository.setResetToken(user.id, tokenHash, expiresAt);

    return {
      message: 'Password reset link generated.',
      resetToken: process.env.NODE_ENV === 'development' ? token : undefined,
    };
  }

  async confirmPasswordReset(request: ConfirmPasswordResetRequest, reply: FastifyReply) {
    const { token, newPassword } = request.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.repository.findByResetToken(tokenHash);

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return reply.status(400).send({ error: 'Invalid or expired token' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.repository.clearResetTokenAndUpdatePassword(user.id, newPasswordHash);

    return { message: 'Password reset successfully' };
  }

  async logout(_request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie('token', { path: '/' });
    return { message: 'Logged out successfully' };
  }
}
