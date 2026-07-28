import { randomBytes } from "node:crypto";

// Excludes visually-ambiguous characters (0/O, 1/l/I) since these get
// hand-copied from a screen onto paper for learners far more often than a
// typical account password does.
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Generate a random plaintext password for a newly-issued learner login. */
export function generatePassword(length = 10): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  }
  return out;
}

/** Build a human-readable login_id suggestion from the owner account's email
 * local-part, e.g. "school.tokyo@example.com" -> "schooltokyo". Actual
 * uniqueness (appending a numeric suffix if taken) is resolved by the
 * caller against the learners table — this just produces the base slug. */
export function loginIdSlugFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const slug = local.toLowerCase().replace(/[^a-z0-9]/g, "");
  return slug.length > 0 ? slug : "user";
}
