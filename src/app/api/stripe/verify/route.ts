import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, isLifetime: true, stripeSubscriptionId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ status: "no_customer" });
  }

  if (user.isLifetime) {
    return NextResponse.json({ status: "lifetime", periodEnd: null });
  }

  try {
    const sessions = await stripe.checkout.sessions.list({
      customer: user.stripeCustomerId,
      limit: 5,
      expand: ["data.subscription"],
    });

    for (const cs of sessions.data) {
      if (cs.payment_status !== "paid") continue;

      if (cs.mode === "payment") {
        await prisma.user.update({
          where: { id: userId },
          data: { isLifetime: true },
        });
        console.log("✅ Verify: lifetime activé pour", userId);
        return NextResponse.json({ status: "lifetime_activated", periodEnd: null });
      }

      if (cs.mode === "subscription" && cs.subscription) {
        const subId = typeof cs.subscription === "string" ? cs.subscription : cs.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId, { expand: ["items.data"] });

        const item = sub.items.data[0];
        const periodEnd = (item as unknown as { current_period_end?: number }).current_period_end
          ?? (sub as unknown as { current_period_end?: number }).current_period_end;

        const periodEndDate = periodEnd ? new Date(periodEnd * 1000) : null;
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: sub.id,
            stripePriceId: item?.price.id ?? null,
            stripeCurrentPeriodEnd: periodEndDate,
          },
        });
        console.log("✅ Verify: abonnement synchronisé pour", userId);
        return NextResponse.json({ status: "subscription_activated", periodEnd: periodEndDate?.toISOString() ?? null });
      }
    }

    return NextResponse.json({ status: "no_paid_session" });
  } catch (err) {
    console.error("❌ Stripe verify error:", err);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}
