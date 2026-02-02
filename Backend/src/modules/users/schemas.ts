export const inviteUserSchema = {
  type: 'object',
  required: ['email', 'role'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['admin', 'worker', 'viewer'] },
  },
} as const;

export const invitationTokenParamsSchema = {
  type: 'object',
  required: ['token'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', minLength: 10 },
  },
} as const;

export const acceptInvitationSchema = {
  type: 'object',
  required: ['token', 'password'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', minLength: 10 },
    password: { type: 'string', minLength: 8 },
  },
} as const;

export const updateUserRoleSchema = {
  type: 'object',
  required: ['role'],
  additionalProperties: false,
  properties: {
    role: { type: 'string', enum: ['admin', 'worker', 'viewer'] },
  },
} as const;

export type InviteUserInput = {
  email: string;
  role: 'admin' | 'worker' | 'viewer';
};

export type AcceptInvitationInput = {
  token: string;
  password: string;
};

export type UpdateUserRoleInput = {
  role: 'admin' | 'worker' | 'viewer';
};
