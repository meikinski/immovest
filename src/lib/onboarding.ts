/**
 * imvestr Onboarding Integration
 * ===============================
 * Hinweis: Das manuelle Anlegen von Loops-Kontakten und Triggern der Onboarding-Sequenz
 * bei user.created wurde entfernt. Stattdessen nutzen wir die native Clerk+Loops Integration.
 *
 * Setup:
 * - Loops Dashboard: Clerk-Integration aktiviert
 * - Clerk Dashboard: Loops Webhook URL eingetragen für user.created/updated/deleted
 * - Custom Fields in Loops: imvestrUserId, imvestrCreatedAt, imvestrPlan
 *
 * Docs: https://loops.so/docs/integrations/clerk
 */

const LOOPS_API_BASE = "https://app.loops.so/api/v1";
const LOOPS_API_KEY = process.env.LOOPS_API_KEY;

/**
 * Aktualisiert den Plan eines Nutzers in Loops (z.B. nach Stripe-Upgrade).
 * Gibt Jonas Analytics-relevante Daten weiter.
 */
export async function updateUserPlan(
  email: string,
  plan: "free" | "premium",
  upgradedAt: string
): Promise<boolean> {
  if (!LOOPS_API_KEY) {
    console.error("[Onboarding] LOOPS_API_KEY fehlt in Umgebungsvariablen");
    return false;
  }

  try {
    // Kontakt in Loops aktualisieren
    const updateResponse = await fetch(`${LOOPS_API_BASE}/contacts/update`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        userGroup: plan,
        imvestrPlan: plan,
        imvestrUpgradedAt: upgradedAt,
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("[Onboarding] Kontakt-Update fehlgeschlagen");
      console.error("[Onboarding] Response:", errorText);
      return false;
    }

    // Upgrade-Event triggern (für Analytics-Sequenz oder Bestätigungs-Mail)
    if (plan === "premium") {
      await fetch(`${LOOPS_API_BASE}/events/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOOPS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          eventName: "imvestr_upgrade_premium",
          eventProperties: { upgradedAt, plan },
        }),
      });
    }

    console.log(`[Onboarding] Plan für ${email} auf "${plan}" aktualisiert`);
    return true;
  } catch (error) {
    console.error("[Onboarding] Fehler beim Plan-Update:", error);
    return false;
  }
}
