"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useProfile } from "@/context/ProfileProvider";
import { useLanguage } from "@/context/LanguageProvider";
import { Crown } from "lucide-react";

type Profile = {
  handle: string;
  display_name: string;
  locale: string;
  subscription_level?: string | null;
  stripe_customer_id?: string | null;
};

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useProfile() as { profile: Profile | null };
  const { t } = useLanguage();

  const isLoggedIn = !!profile;
  const plan = profile?.subscription_level ?? "basic";
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const handleUpgrade = async (cycle: "monthly" | "yearly") => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (plan === "pro") return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const priceId =
      cycle === "monthly"
        ? process.env.NEXT_PUBLIC_PRICE_PAPAYA_MONTHLY
        : process.env.NEXT_PUBLIC_PRICE_PAPAYA_YEARLY;

    const payload: any = {
      priceId,
      successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/pricing`,
      mode: "subscription",
      metadata: { userId },
    };

    if (profile?.stripe_customer_id) {
      payload.customerId = profile.stripe_customer_id;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      console.error(json.error || "Checkout failed");
    }
  };

  const proButtonText = useMemo(() => {
    if (!isLoggedIn) return t("pricing_sign_in_to_upgrade");
    if (plan === "pro") return t("pricing_you_are_pro");
    return billingCycle === "monthly"
      ? t("pricing_upgrade_monthly")
      : t("pricing_upgrade_yearly");
  }, [isLoggedIn, plan, billingCycle, t]);

  const proButtonDisabled = isLoggedIn && plan === "pro";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          {t("pricing_title")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-300">
          {t("pricing_subtitle")}
        </p>
      </div>

      {/* Plan cards */}
      <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2">
        {/* Basic */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("pricing_basic")}</h2>
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
              {t("pricing_free")}
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-300">
            {t("pricing_basic_desc")}
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              • {t("pricing_basic_flows")}
            </li>
            <li className="flex items-center gap-2">
              • {t("pricing_no_badge")}
            </li>
          </ul>

          <button
            onClick={() => router.push(isLoggedIn ? "/flows" : "/login")}
            className="mt-8 w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-medium text-black hover:opacity-90"
          >
            {isLoggedIn ? t("pricing_go_flows") : t("pricing_get_started")}
          </button>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border border-amber-500/50 bg-neutral-900 p-6 ring-1 ring-amber-500/30">
          <div className="absolute -top-3 left-6 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black shadow">
            {t("pricing_recommended")}
          </div>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              {t("pricing_pro")}
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-xs font-bold text-black">
                <Crown className="h-3 w-3" />
                PRO
              </span>
            </h2>
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
              {t("pricing_paid")}
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-300">
            {t("pricing_pro_desc")}
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              • {t("pricing_pro_flows")}
            </li>
            <li className="flex items-center gap-2">
              • {t("pricing_pro_badge")}
            </li>
          </ul>

          {/* Billing cycle selector */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-2 rounded-full bg-neutral-800 p-1 text-xs">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 rounded-full px-3 py-1 ${
                  billingCycle === "monthly"
                    ? "bg-white text-black"
                    : "text-neutral-400"
                }`}
              >
                {t("pricing_monthly")}
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`flex-1 rounded-full px-3 py-1 ${
                  billingCycle === "yearly"
                    ? "bg-white text-black"
                    : "text-neutral-400"
                }`}
              >
                {t("pricing_yearly")}
              </button>
            </div>

            {/* Price display */}
            <p className="text-sm font-medium text-neutral-200">
              {billingCycle === "monthly" ? "CAD $5" : "CAD $50"}
            </p>
          </div>

          <button
            disabled={proButtonDisabled}
            onClick={() => handleUpgrade(billingCycle)}
            className={`mt-6 w-full rounded-xl px-4 py-3 text-center text-sm font-medium ${
              proButtonDisabled
                ? "cursor-not-allowed bg-neutral-800 text-neutral-500"
                : "bg-white text-black hover:opacity-90"
            }`}
          >
            {proButtonText}
          </button>

          {isLoggedIn && plan === "pro" && (
            <p className="mt-3 text-center text-xs text-neutral-400">
              {t("pricing_thanks")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
