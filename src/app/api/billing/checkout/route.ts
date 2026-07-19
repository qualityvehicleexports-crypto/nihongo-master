import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { handleApiError, requireAccount } from "@/lib/api-helpers";
import { setStripeInfo } from "@/lib/repo/accounts";

// One plan: "Family / Team 20" — a single subscription that unlocks up to
// 20 learner profiles on the account. Set STRIPE_SECRET_KEY and
// STRIPE_PRICE_ID_FAMILY_20 in .env.local to enable real checkout; without
// them this route explains what's missing instead of crashing, so the rest
// of the app (including the AI + quiz features) stays demoable without a
// Stripe account.
export async function POST(req: NextRequest) {
  try {
    const account = await requireAccount();

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID_FAMILY_20;
    const appUrl = process.env.APP_URL ?? new URL(req.url).origin;

    if (!secretKey || !priceId) {
      return NextResponse.json(
        {
          error:
            "Stripeが未設定です。STRIPE_SECRET_KEY と STRIPE_PRICE_ID_FAMILY_20 を .env.local に設定してください。",
          demoMode: true,
        },
        { status: 501 },
      );
    }

    const stripe = new Stripe(secretKey);

    let customerId = account.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: account.email, metadata: { accountId: account.id } });
      customerId = customer.id;
      await setStripeInfo(account.id, { stripe_customer_id: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?status=success`,
      cancel_url: `${appUrl}/billing?status=cancelled`,
      metadata: { accountId: account.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
