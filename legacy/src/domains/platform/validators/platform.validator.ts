import { z } from 'zod';
import { objectIdSchema } from '../../../shared/validators/objectid.validator';

export const platformIdParamSchema = z.object({
  id: objectIdSchema,
});
