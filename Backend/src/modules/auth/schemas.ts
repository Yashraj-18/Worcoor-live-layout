export const loginSchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
  },
} as const;

export const registerSchema = {
  type: 'object',
  required: ['organizationName', 'email', 'password'],
  additionalProperties: false,
  properties: {
    organizationName: { type: 'string', minLength: 3, maxLength: 255 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
  },
} as const;

export const requestPasswordResetSchema = {
  type: 'object',
  required: ['email'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
  },
} as const;

export const confirmPasswordResetSchema = {
  type: 'object',
  required: ['token', 'newPassword'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', minLength: 1 },
    newPassword: { type: 'string', minLength: 8 },
  },
} as const;

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  organizationName: string;
  email: string;
  password: string;
};

export type RequestPasswordResetInput = {
  email: string;
};

export type ConfirmPasswordResetInput = {
  token: string;
  newPassword: string;
};
