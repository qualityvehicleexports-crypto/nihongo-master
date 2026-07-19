import { all, get, run } from "../db";
import { newId } from "../ids";

export interface Account {
  id: string;
  email: string;
  password_hash: string;
  plan: string;
  max_learners: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
}

export async function createAccount(email: string, passwordHash: string): Promise<Account> {
  const id = newId("acc");
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  await run(
    `INSERT INTO accounts (id, email, password_hash, plan, max_learners, subscription_status, trial_ends_at)
     VALUES (?, ?, ?, 'family_20', 20, 'trialing', ?)`,
    [id, email.toLowerCase().trim(), passwordHash, trialEndsAt],
  );
  const account = await get<Account>("SELECT * FROM accounts WHERE id = ?", [id]);
  if (!account) throw new Error("Failed to create account");
  return account;
}

export async function getAccountByEmail(email: string): Promise<Account | undefined> {
  return get<Account>("SELECT * FROM accounts WHERE email = ?", [email.toLowerCase().trim()]);
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  return get<Account>("SELECT * FROM accounts WHERE id = ?", [id]);
}

export async function setStripeInfo(
  accountId: string,
  fields: Partial<Pick<Account, "stripe_customer_id" | "stripe_subscription_id" | "subscription_status">>,
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    params.push(value);
  }
  if (sets.length === 0) return;
  params.push(accountId);
  await run(`UPDATE accounts SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function listAllAccounts(): Promise<Account[]> {
  return all<Account>("SELECT * FROM accounts ORDER BY created_at DESC");
}
