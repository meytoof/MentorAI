import Stripe from "stripe";

// Placeholder pour le build quand Stripe n'est pas configuré (STRIPE_SECRET_KEY vide)
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_build_placeholder";
export const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

// Plans disponibles
export const PLANS = {
  monthly: {
    name: "MentorIA Mensuel",
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    price: 9.99,
    interval: "month" as const,
    description: "Accès illimité, résiliable à tout moment",
  },
  lifetime: {
    name: "MentorIA à Vie",
    priceId: process.env.STRIPE_PRICE_LIFETIME!,
    price: 79,
    interval: "one_time" as const,
    description: "Paiement unique, accès permanent",
  },
} as const;

// Vérifie si un utilisateur a un accès valide (essai, abonnement actif, ou lifetime)
export function hasActiveAccess(user: {
  trialEndsAt: Date;
  stripeCurrentPeriodEnd: Date | null;
  isLifetime: boolean;
}): boolean {
  if (user.isLifetime) return true;
  if (user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > new Date()) return true;
  if (user.trialEndsAt > new Date()) return true;
  return false;
}
