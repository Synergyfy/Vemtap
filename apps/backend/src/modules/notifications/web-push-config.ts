/**
 * Shared latch for whether Web Push (VAPID) has been configured.
 *
 * `web-push` stores its VAPID details in module state, and `@types/web-push`
 * exposes no getter for it — so the processor that actually sends a Web Push
 * subscription cannot ask whether the service that configured it succeeded.
 *
 * Both classes run in the same process and read the same env, so a single
 * latch set at construction is the honest answer: it is `true` exactly when
 * `setVapidDetails` has been given a real key pair.
 */
let webPushConfigured = false;

export const webPushConfig = {
  isConfigured(): boolean {
    return webPushConfigured;
  },
  markConfigured(value: boolean): void {
    webPushConfigured = value;
  },
};
