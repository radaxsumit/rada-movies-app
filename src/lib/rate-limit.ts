/** Turns the database's rate-limit error (see the moderation migration) into a friendly message. */
export function limitMessage(error: { message?: string } | null | undefined) {
  return error?.message?.includes("rate_limited")
    ? "You’re posting very fast. Take a breather and try again in a little while."
    : null;
}
