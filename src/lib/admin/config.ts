/**
 * Fixed general admin of the system. Matches the email hardcoded in the
 * `handle_new_user` trigger and the admin RLS policies (supabase/migrations/
 * 0010_admin_approval.sql) - kept in one place here for application-level
 * checks (which pages to show, which server actions to allow), but the
 * database-level admin bypass policies are the actual authorization
 * boundary and do not depend on this constant.
 */
export const ADMIN_EMAIL = "pedroadair96@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").toLowerCase() === ADMIN_EMAIL;
}
