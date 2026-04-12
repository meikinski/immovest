// src/app/api/webhooks/clerk/route.ts
//
// Clerk Webhook-Endpunkt — empfängt user.created Events und triggert
// den Onboarding-Agent Kai via OpenClaw Gateway.
//
// Benötigte Umgebungsvariablen:
//   CLERK_WEBHOOK_SECRET   – Webhook Signing Secret aus der Clerk-Konsole
//   ONBOARDING_WEBHOOK_URL – URL des OpenClaw Gateway-Endpunkts für Kai
//                            Beispiel: https://your-openclaw-gateway/webhook/kai
//                            (analog zu einer OpenClaw-Webhook-URL für agentId "kai")

import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserCreatedEvent {
  type: 'user.created';
  data: {
    id: string;
    email_addresses: ClerkEmailAddress[];
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    created_at: number; // Unix timestamp in ms
  };
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // 1. Signatur-Header lesen
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('❌ [CLERK_WEBHOOK] Missing Svix headers');
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }

  // 2. Webhook Secret prüfen
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('❌ [CLERK_WEBHOOK] CLERK_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // 3. Body als Text lesen (wichtig: vor JSON-Parsing, für Signaturprüfung)
  const body = await req.text();

  // 4. Signatur verifizieren (via Svix)
  let event: ClerkUserCreatedEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserCreatedEvent;
  } catch (err) {
    console.error('❌ [CLERK_WEBHOOK] Signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  // 5. Nur user.created verarbeiten
  if (event.type !== 'user.created') {
    console.log(`ℹ️ [CLERK_WEBHOOK] Ignoring event type: ${event.type}`);
    return NextResponse.json({ received: true, message: 'Event ignored' });
  }

  console.log('👤 [CLERK_WEBHOOK] user.created received:', event.data.id);

  // 6. Primäre E-Mail-Adresse ermitteln
  const primaryEmail = event.data.email_addresses.find(
    (e) => e.id === event.data.primary_email_address_id
  );

  const payload = {
    event: 'user.created',
    userId: event.data.id,
    email: primaryEmail?.email_address ?? '',
    firstName: event.data.first_name ?? '',
    lastName: event.data.last_name ?? '',
    createdAt: new Date(event.data.created_at).toISOString(),
  };

  console.log('📦 [CLERK_WEBHOOK] Payload für Kai:', payload);

  // 7. Kai via OpenClaw Gateway triggern (für KI-Onboarding)
  // Loops-Sync erfolgt jetzt nativ via Clerk+Loops Integration (kein manueller API-Call mehr nötig)
  //
  // ONBOARDING_WEBHOOK_URL muss auf den OpenClaw Webhook-Endpunkt für Kai zeigen.
  // Beispiel-Format (OpenClaw Gateway):
  //   https://<your-domain>/api/webhook/message?agentId=kai&secret=<shared-secret>
  // Trage die korrekte URL in .env.local ein.
  const onboardingWebhookUrl = process.env.ONBOARDING_WEBHOOK_URL;

  if (!onboardingWebhookUrl) {
    console.warn(
      '⚠️ [CLERK_WEBHOOK] ONBOARDING_WEBHOOK_URL not set — Kai was NOT triggered. ' +
        'Set this variable to the OpenClaw Gateway webhook URL for agent "kai".'
    );
    // Trotzdem 200 zurückgeben, damit Clerk nicht re-tried
    return NextResponse.json({
      received: true,
      warning: 'ONBOARDING_WEBHOOK_URL not configured — Kai not triggered',
    });
  }

  try {
    const response = await fetch(onboardingWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `❌ [CLERK_WEBHOOK] Kai trigger failed: ${response.status} ${response.statusText}`,
        text
      );
      // Fehler loggen, aber Clerk trotzdem 200 antworten (verhindert Retry-Loops)
      return NextResponse.json(
        { received: true, warning: 'Kai trigger failed', status: response.status },
        { status: 200 }
      );
    }

    console.log('✅ [CLERK_WEBHOOK] Kai successfully triggered for user:', payload.userId);
  } catch (err) {
    console.error('❌ [CLERK_WEBHOOK] Error triggering Kai:', err);
    // Fehler loggen, Clerk 200 antworten
    return NextResponse.json(
      { received: true, warning: 'Kai trigger error', error: String(err) },
      { status: 200 }
    );
  }

  return NextResponse.json({ received: true });
}
