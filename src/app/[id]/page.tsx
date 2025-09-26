"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2 } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { useLanguage } from "@/context/LanguageProvider";

const supabase = createClient();
const MAX_DESC_LEN = 200;

type Profile = {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  subscription_level?: string | null; // 👈 add this
};
type Flow = {
  id: string;
  name: string;
  privacy: "public" | "private";
  created_at?: string;
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>(); // handle
  const { t } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  // auth + ownership
  const [viewerId, setViewerId] = useState<string | null>(null);
  const isOwner = useMemo(() => {
    return !!profile && !!viewerId && profile.id === viewerId;
  }, [profile, viewerId]);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [draftDesc, setDraftDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        setLoading(true);
        // who is viewing?
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user) setViewerId(auth.user.id);

        if (!id) {
          setLoading(false);
          return;
        }

        // profile by handle
        const { data: p } = await supabase
          .from("profiles")
          .select("id, handle, name, description, subscription_level") // 👈 fetch sub level
          .eq("handle", id)
          .single();

        if (!p) {
          if (mounted) {
            setProfile(null);
            setFlows([]);
            setLoading(false);
          }
          return;
        }

        // flows that are public
        const { data: fs } = await supabase
          .from("flows")
          .select("id, name, privacy, created_at")
          .eq("user_id", p.id)
          .eq("privacy", "public")
          .order("created_at", { ascending: false });

        if (mounted) {
          setProfile(p);
          setFlows(fs || []);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function saveEdit() {
    if (!profile || !viewerId || profile.id !== viewerId) return;
    const trimmed = draftDesc.trim();
    if (trimmed.length > MAX_DESC_LEN) {
      setError(t("edit_description_hint", { max: String(MAX_DESC_LEN) }));
      return;
    }

    setSaving(true);
    setError(null);
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ description: trimmed.length ? trimmed : null })
      .eq("id", profile.id);

    setSaving(false);
    if (upErr) {
      setError("Failed to update. Try again.");
      return;
    }
    setProfile((prev) =>
      prev ? { ...prev, description: trimmed || null } : prev
    );
    setEditOpen(false);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center text-gray-400">
        {t("loading")}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center text-red-400">
        {t("profile_not_found")}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Identity */}

      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-3">
          {profile.name}
          {profile.subscription_level === "pro" && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-sm">
              PRO
            </span>
          )}
        </h1>
        <p className="mt-1 text-neutral-400">@{profile.handle}</p>
        {/* Description / Quote */}
        <div className="mt-6 relative mx-auto max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur p-5 text-lg text-neutral-300">
          <div className="flex items-start gap-3">
            <div className="text-3xl leading-none select-none">“</div>
            <p className="flex-1 italic">
              {profile.description ? (
                profile.description
              ) : (
                <span className="text-neutral-500">{t("no_public_flows")}</span>
              )}
            </p>
            {isOwner && (
              <Button
                onClick={() => {
                  setDraftDesc(profile.description ?? "");
                  setEditOpen(true);
                }}
                className="h-9 w-9 shrink-0 rounded-full hover:bg-neutral-800"
                title={t("edit_description")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Public Flows */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {t("public_flows")}
        </h2>

        {flows.length === 0 ? (
          <p className="text-neutral-400 text-center">{t("no_public_flows")}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {flows.map((flow) => (
              <Link
                key={flow.id}
                href={`/flows/${flow.id}`}
                className="group relative aspect-square rounded-2xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition shadow-sm hover:shadow-md flex items-center justify-center text-center p-4"
              >
                <span className="text-base md:text-lg font-medium text-neutral-200 group-hover:text-white">
                  {flow.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 grid place-items-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold">
              {t("edit_description")}
            </Dialog.Title>
            <p className="mt-1 text-sm text-neutral-400">
              {t("edit_description_hint", { max: String(MAX_DESC_LEN) })}
            </p>

            <div className="mt-4">
              <textarea
                value={draftDesc}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_DESC_LEN)
                    setDraftDesc(e.target.value);
                }}
                rows={5}
                placeholder={t("description_placeholder")}
                className="w-full resize-none rounded-xl border bg-neutral-950 border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-700 p-3 text-neutral-200 placeholder-neutral-500"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  {t("chars_count", {
                    count: String(draftDesc.trim().length),
                    max: String(MAX_DESC_LEN),
                  })}
                </span>
                {error && <span className="text-red-400">{error}</span>}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                onClick={() => setEditOpen(false)}
                className="hover:bg-neutral-900"
              >
                {t("cancel")}
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("save")
                )}
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
