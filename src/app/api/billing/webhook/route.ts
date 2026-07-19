import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { setStripeInfo } from "@/lib/repo/accounts";

// Stripe webhook: keeps subscription_status in sync so the app can gate
// features (e.g. the 20-learner cap already exists independent of billing
// status, but you'd extend this handler to freeze new learner creation on
// `past_due` / `canceled` in production).
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 501 });
  }

  const stripe = new Stripe(secretKey);
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = session.metadata?.accountId;
      if (accountId) {
        await setStripeInfo(accountId, {
          stripe_subscription_id: (session.subscription as string) ?? null,
          subscription_status: "active",
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const accountId = subscription.metadata?.accountId;
      if (accountId) {
        await setStripeInfo(accountId, { subscription_status: subscription.status });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
