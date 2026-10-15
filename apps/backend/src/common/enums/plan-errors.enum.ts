/**
 * Machine-readable reasons a plan can refuse an action.
 *
 * These are sent as the `error` field of a 403 body (see
 * `AllExceptionsFilter`, which forwards `message.error` verbatim) so clients can
 * tell a plan restriction apart from a permission problem or a generic
 * forbidden, and show copy that actually helps — without matching on the
 * wording of the human `message`, which is free to change or be reworded for a
 * locale without breaking anything.
 *
 * Keep these stable: they are an API contract, not internal detail. Add a new
 * slug rather than reusing an existing one for a different cause.
 */
export const PLAN_ERRORS = {
  /** The plan does not include the feature at all. */
  FEATURE_NOT_INCLUDED: 'PLAN_FEATURE_NOT_INCLUDED',
  /** The plan includes the feature but the business has used its allowance. */
  LIMIT_REACHED: 'PLAN_LIMIT_REACHED',
} as const;

export type PlanErrorCode = (typeof PLAN_ERRORS)[keyof typeof PLAN_ERRORS];