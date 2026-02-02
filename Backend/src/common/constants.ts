export const ROLES = ['admin', 'worker', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const UNIT_STATUSES = ['LIVE', 'OFFLINE', 'MAINTENANCE', 'PLANNING'] as const;
