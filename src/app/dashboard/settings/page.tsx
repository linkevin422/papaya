"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Pencil } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

const supabase = createClient();

type Profile = {
  handle: string;
  name: string;
};

export default function SettingsPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile>({ handle: "", name: "" });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState<{ name: boolean; handle: boolean }>({
    name: false,
    handle: false,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("handle, name")
        .eq("id", session.user.id)
        .single();

      if (!mounted) return;

      if (data) {
        setProfile({
          handle: data.handle || "",
          name: data.name || "",
        });
      } else if (error) {
        console.error("Profile load error:", error.message);
        setMsg(t("failed_load"));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [t]);

  async function save() {
    setMsg(null);

    // validate handle
    const handleOk = /^[a-zA-Z0-9_-]{3,20}$/.test(profile.handle);
    if (!handleOk) {
      setMsg(t("handle_invalid"));
      return;
    }

    // ensure handle is unique
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", profile.handle);

    const { data: userData } = await supabase.auth.getUser();
    const id = userData.user?.id;

    if (existing && existing.length > 0) {
      const taken = existing.some((row) => row.id !== id);
      if (taken) {
        setMsg(t("handle_taken"));
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id, ...profile });
    setMsg(error ? error.message : t("saved"));
    setEditing({ name: false, handle: false });
  }

  async function deleteAccount() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    await supabase.from("profiles").delete().eq("id", userId);
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      setMsg("Error deleting user: " + error.message);
    } else {
      setMsg(t("deleted"));
      window.location.href = "/";
    }
  }

  if (loading)
    return <p className="opacity-70 text-sm px-4 py-6">{t("loading")}</p>;

  return (
    <div className="max-w-md space-y-6 px-4 py-6">
      <h1 className="text-lg font-semibold">{t("settings")}</h1>

      {/* Name */}
      <div>
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-80">{t("name")}</span>
          <button
            onClick={() => setEditing((e) => ({ ...e, name: !e.name }))}
            className="text-neutral-400 hover:text-neutral-200"
          >
            <Pencil size={14} />
          </button>
        </div>
        <input
          className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-sm disabled:opacity-50"
          value={profile.name}
          disabled={!editing.name}
          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
        />
        <p className="text-xs opacity-60 mt-1">{t("name_hint")}</p>
      </div>

      {/* Handle */}
      <div>
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-80">{t("handle")}</span>
          <button
            onClick={() => setEditing((e) => ({ ...e, handle: !e.handle }))}
            className="text-neutral-400 hover:text-neutral-200"
          >
            <Pencil size={14} />
          </button>
        </div>
        <input
          className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-sm disabled:opacity-50"
          value={profile.handle}
          disabled={!editing.handle}
          onChange={(e) =>
            setProfile((p) => ({ ...p, handle: e.target.value }))
          }
        />
        <p className="text-xs opacity-60 mt-1">{t("handle_hint")}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-lg px-4 py-2 bg-neutral-100 text-neutral-900 text-sm"
        >
          {t("save")}
        </button>
        {msg && <span className="text-sm opacity-80">{msg}</span>}
      </div>

      <hr className="border-neutral-800" />

      {/* Danger Zone */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-red-400">
            {t("danger_zone")}
          </h2>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-500 hover:underline"
            >
              {t("delete_account")}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm opacity-80">{t("delete_warning")}</p>
              <div className="flex gap-3">
                <button
                  onClick={deleteAccount}
                  className="rounded-lg px-3 py-2 text-sm bg-red-600 text-white"
                >
                  {t("confirm_delete")}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-2 text-sm bg-neutral-800 text-white"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
