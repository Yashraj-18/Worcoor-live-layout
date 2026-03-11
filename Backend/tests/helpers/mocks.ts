import type { FastifyReply, FastifyRequest } from 'fastify';
import { vi } from 'vitest';

type MockUserContext = {
  organizationId: string;
  userId?: string;
  role?: string;
};

export type MockedReply = FastifyReply & {
  statusCode: number;
  payload: any;
  cookies: Record<string, string>;
};

export function createMockReply(): MockedReply {
  const reply: Partial<FastifyReply> & { statusCode: number; payload: unknown; cookies: Record<string, string> } = {
    statusCode: 200,
    payload: undefined,
    cookies: {},
  };

  reply.code = vi.fn(function (this: MockedReply, statusCode: number) {
    this.statusCode = statusCode;
    return this;
  }) as FastifyReply['code'];

  reply.status = reply.code;

  reply.send = vi.fn(function (this: MockedReply, payload: unknown) {
    this.payload = payload;
    return this;
  }) as FastifyReply['send'];

  reply.jwtSign = vi.fn(async () => 'mock-jwt') as FastifyReply['jwtSign'];

  reply.setCookie = vi.fn(function (this: MockedReply, name: string, value: string) {
    this.cookies[name] = value;
    return this;
  }) as FastifyReply['setCookie'];

  reply.clearCookie = vi.fn(function (this: MockedReply, name: string) {
    delete this.cookies[name];
    return this;
  }) as FastifyReply['clearCookie'];

  return reply as MockedReply;
}

export function createMockRequest<TBody = unknown, TParams = unknown, TQuery = unknown>({
  body,
  params,
  query,
  user,
  server,
}: {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
  user?: MockUserContext;
  server?: any;
}) {
  const mockRequest = {
    body,
    params,
    query,
    user: user ?? { organizationId: 'org-1', role: 'admin', userId: 'user-1' },
    server: server ?? { io: { emit: vi.fn() } },
  };

  return mockRequest as FastifyRequest<{
    Body: TBody;
    Params: TParams;
    Querystring: TQuery;
  }> & { user: MockUserContext };
}
