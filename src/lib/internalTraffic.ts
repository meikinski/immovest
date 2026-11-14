import 'server-only';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Interner Traffic: Konten, deren bestätigte E-Mail in INTERNAL_USER_EMAILS (kommagetrennt) steht.
 * Nur serverseitig. Nach außen geht ausschließlich ein Boolean bzw. traffic_type: "internal", nie die E-Mail.
 */
const interneEmails = (): string[] =>
  (process.env.INTERNAL_USER_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

export async function istInternerNutzer(userId: string | null | undefined): Promise<boolean> {
  const intern = interneEmails();
  if (!userId || intern.length === 0) return false;
  try {
    const user = await (await clerkClient()).users.getUser(userId);
    return user.emailAddresses
      .filter(e => e.verification?.status === 'verified')
      .some(e => intern.includes(e.emailAddress.toLowerCase()));
  } catch {
    return false;
  }
}
