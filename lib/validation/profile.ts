import { z } from 'zod';
import { fullNameSchema } from '@/lib/validation/auth';

/** Account profile contract (ADR-0005). */
export const updateProfileSchema = z.object({ fullName: fullNameSchema });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
