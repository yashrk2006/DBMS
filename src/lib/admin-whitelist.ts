/**
 * Administrative Whitelist for Admin Access.
 * Only emails in this list can synthesize an Admin Identity.
 */
export const ADMIN_EMAILS = [
  'admin@skillsync.com',
  'kushwaha.vijay97@gmail.com', // Adding the user's likely email as a fallback
  // Add other authorized admin emails here
];

export function isAuthorizedAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
