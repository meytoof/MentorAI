import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (!webhookSecret) {
    console.warn("⚠️ STRIPE_WEBHOOK_SECRET non configuré — webhook ignoré. Utilisez /api/stripe/verify comme fallback.");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature invalide:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("📩 Webhook Stripe:", event.type);

  switch (event.type) {
    // Abonnement créé ou renouvelé
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
      const subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id;
      if (!subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data"] });
      const userId = sub.metadata?.userId;
      if (!userId) break;

      const item = sub.items.data[0];
      const periodEnd = (item as unknown as { current_period_end?: number }).current_period_end
        ?? (sub as unknown as { current_period_end?: number }).current_period_end;

      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: sub.id,
          stripePriceId: item?.price.id ?? null,
          stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        },
      });
      console.log("✅ Abonnement activé pour userId:", userId);
      break;
    }

    // Abonnement annulé ou expiré
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (!userId) break;

      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        },
      });
      console.log("❌ Abonnement annulé pour userId:", userId);
      break;
    }

    // Paiement unique (lifetime)
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "payment") break;

      const userId = session.metadata?.userId;
      if (!userId) break;

      await prisma.user.update({
        where: { id: userId },
        data: { isLifetime: true },
      });
      console.log("🎉 Lifetime activé pour userId:", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
