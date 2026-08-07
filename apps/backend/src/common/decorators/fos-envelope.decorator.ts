import { SetMetadata } from '@nestjs/common';

export const FOS_ENVELOPE_KEY = 'fos_envelope';
/**
 * Opt-in marker that wraps a controller handler's response in the FOS
 * `{ success: true, data }` envelope. Apply at the controller or route level.
 */
export const FosEnvelope = () => SetMetadata(FOS_ENVELOPE_KEY, true);
