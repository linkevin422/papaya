/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useProfile } from "@/context/ProfileProvider";
import { useLanguage } from "@/context/LanguageProvider";

type Flow = {
  id: string;
  name: string;
  created_at: string;
  privacy: "private" | "public";
  public_mode: number | null;
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("flows")
        .select("id, name, created_at, privacy, public_mode")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setFlows(data ?? []);
      setLoading(false);
    };

    load();
  }, [supabase, router]);

  const canCreateFlow = () => {
    if (!profile) return false;
    if (profile.subscription_level === "basic") return flows.length === 0;
    if (profile.subscription_level === "pro") return flows.length < 10;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Flows */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-neutral-200">
            {t("your_flows")}
          </h2>

          {/* Action button */}
          {!loading &&
            (canCreateFlow() ? (
              <Link
                href="/flows/new"
                className="rounded-xl bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 border border-neutral-700"
              >
                {t("new_flow")}
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="rounded-xl border border-amber-500/40 text-amber-400 px-3 py-1.5 text-sm hover:bg-amber-500/10"
              >
                {t("upgrade_more_flows")}
              </Link>
            ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="h-20 rounded-2xl bg-neutral-900/70 animate-pulse" />
            <div className="h-20 rounded-2xl bg-neutral-900/70 animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-400">
            {t("error_loading_flows")}: {error}
          </p>
        )}

        {!loading && !error && flows.length === 0 && (
          <div className="rounded-2xl border border-neutral-800 p-8 text-center">
            <p className="text-sm text-neutral-400">{t("no_flows")}</p>
            {canCreateFlow() ? (
              <Link
                href="/flows/new"
                className="mt-3 inline-block rounded-xl bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 border border-neutral-700"
              >
                {t("create_first_flow")}
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="mt-3 inline-block rounded-xl border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
              >
                {t("see_plans")}
              </Link>
            )}
          </div>
        )}

        {!loading && !error && flows.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flows.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/flows/${f.id}`}
                  className="group block rounded-2xl border border-neutral-800 p-4 hover:bg-neutral-900 transition"
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">
                      {f.name || t("untitled_flow")}
                    </p>
                    <svg
                      className="h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-500">
                    {new Date(f.created_at).toLocaleString()}
                    <span className="mx-2">•</span>
                    {f.privacy === "public" ? t("public") : t("private")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
