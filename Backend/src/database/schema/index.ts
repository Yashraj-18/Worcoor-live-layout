export * from './organization.js';
export * from './user.js';
export * from './user-invitations.js';
export * from './units.js';
export * from './layouts.js';
export * from './location-tags.js';
export * from './components.js';
export * from './skus.js';
export * from './assets.js';
export * from './sku-movements.js';

import { organizations } from './organization.js';
import { users } from './user.js';
import { userInvitations } from './user-invitations.js';
import { units } from './units.js';
import { layouts } from './layouts.js';
import { locationTags } from './location-tags.js';
import { components } from './components.js';
import { skus } from './skus.js';
import { assets } from './assets.js';
import { skuMovements } from './sku-movements.js';

export const schema = {
  organizations,
  users,
  userInvitations,
  units,
  layouts,
  locationTags,
  components,
  skus,
  assets,
  skuMovements,
};
