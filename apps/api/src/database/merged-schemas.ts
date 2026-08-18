import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as conferenceSchema from './schemas/conference';
import * as emailSchema from './schemas/email';
import * as registrationsSchema from './schemas/registrations';
import * as submissionsSchema from './schemas/submissions';
import * as usersSchema from './schemas/users';

export const mergedSchemas = {
  ...usersSchema,
  ...conferenceSchema,
  ...submissionsSchema,
  ...registrationsSchema,
  ...emailSchema,
};

export type DatabaseSchemas = typeof mergedSchemas;

export type DrizzleDatabase = NodePgDatabase<DatabaseSchemas>;
