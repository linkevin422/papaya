"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { Wallet, Globe, Users, Briefcase, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  node: { id: string; name: string; type?: string | null };
  refresh: () => void;
};

const NODE_TYPES = [
  { value: "Pocket", label: "Pocket", icon: Wallet },
  { value: "Platform", label: "Platform", icon: Globe },
  { value: "People", label: "People", icon: Users },
  { value: "Portfolio", label: "Portfolio", icon: Briefcase },
  { value: "Other", label: "Other", icon: HelpCircle },
];

const NODE_HINTS: Record<string, string> = {
  Pocket: "Cash, Bank Account, PayPal",
  Platform: "Shopee, YouTube, Stripe",
  People: "Employer, Client, Sponsor",
  Portfolio: "ETF, Crypto Wallet, Royalties",
  Other: "Anything else",
};

const supabase = createClient();

export default function NodeModal({ open, onClose, node, refresh }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState(node.name);
  const [type, setType] = useState<string>(node.type || "Platform");
  const [saving, setSaving] = useState(false);

  // delete confirm
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [connectedCount, setConnectedCount] = useState<number | null>(null);

  useEffect(() => {
    setName(node.name);
    setType(node.type || "Platform");
  }, [node]);

  useEffect(() => {
    if (!open || !node.id) return;
    // fetch number of connected edges for delete warning
    const loadConnections = async () => {
      const { count } = await supabase
        .from("edges")
        .select("id", { count: "exact", head: true })
        .or(`source_id.eq.${node.id},target_id.eq.${node.id}`);
      setConnectedCount(count ?? 0);
    };
    loadConnections();
  }, [open, node.id]);

  // state
  const dirty = useMemo(
    () =>
      name.trim() !== (node.name || "").trim() ||
      (type || "") !== (node.type || "Platform"),
    [name, type, node.name, node.type]
  );
  const valid = name.trim().length > 0;

  // actions
  const handleSave = useCallback(async () => {
    if (!valid || saving) return;
    setSaving(true);
    await supabase
      .from("nodes")
      .update({ name: name.trim(), type })
      .eq("id", node.id);
    setSaving(false);
    await refresh();
    onClose();
  }, [valid, saving, name, type, node.id, refresh, onClose]);

  const tryDelete = () => setConfirmDeleteOpen(true);

  const handleDeleteConfirmed = async () => {
    await supabase.from("nodes").delete().eq("id", node.id);
    setConfirmDeleteOpen(false);
    await refresh();
    onClose();
  };

  // keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter")
        handleSave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, handleSave]);

  const CurrentIcon =
    NODE_TYPES.find((t) => t.value === type)?.icon || HelpCircle;

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/70" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 text-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <Dialog.Title className="truncate text-xl font-semibold tracking-tight">
              {t("nodemodal_edit_node")}
            </Dialog.Title>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/60">
                {t("nodemodal_name")}
              </label>
              <Input
                autoFocus
                placeholder={t("nodemodal_name_placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/60">
                {t("nodemodal_type")}
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 flex-1 rounded-lg bg-zinc-900 px-3 text-sm text-white outline-none border border-white/10 focus:ring-2 focus:ring-white/20"
                >
                  {NODE_TYPES.map((tObj) => (
                    <option key={tObj.value} value={tObj.value}>
                      {tObj.label}
                    </option>
                  ))}
                </select>
                <CurrentIcon className="h-5 w-5 text-white/70" />
              </div>
              <p className="mt-1 text-xs text-white/50">
                {t("nodemodal_examples")}: {NODE_HINTS[type]}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <button
                onClick={tryDelete}
                className="h-10 inline-flex items-center justify-center rounded-md border border-red-500/50 px-4 text-red-300 hover:text-red-200 hover:border-red-400 transition"
              >
                {t("nodemodal_delete_node")}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="h-10 rounded-md border border-white/10 px-4 text-white hover:text-gray-300"
                >
                  {t("nodemodal_cancel")}
                </button>
                <Button
                  onClick={handleSave}
                  disabled={!valid || !dirty || saving}
                  className="h-10 min-w-[96px]"
                >
                  {saving ? t("nodemodal_saving") : t("nodemodal_save")}
                </Button>
              </div>
            </div>

            {typeof connectedCount === "number" && connectedCount > 0 && (
              <div className="mt-2 text-xs text-red-300">
                {connectedCount === 1
                  ? t("nodemodal_links_affected_single")
                  : t("nodemodal_links_affected_multi", {
                      count: String(connectedCount),
                    })}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>

      {/* confirm delete */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        className="fixed inset-0 z-[60]"
      >
        <div className="fixed inset-0 bg-black/80" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-zinc-950 p-6 text-white">
            <Dialog.Title className="text-lg font-semibold">
              {t("nodemodal_delete_node_title")}
            </Dialog.Title>
            <p className="text-sm text-white/80">
              {t("nodemodal_delete_node_msg")} <b>{name || "this node"}</b>.{" "}
              {typeof connectedCount === "number" && connectedCount > 0 ? (
                <>
                  {connectedCount === 1
                    ? t("nodemodal_links_affected_single")
                    : t("nodemodal_links_affected_multi", {
                        count: String(connectedCount),
                      })}
                </>
              ) : null}{" "}
              {t("nodemodal_delete_warning")}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                className="h-10 rounded-md border border-white/10 px-4 text-white hover:text-gray-300"
              >
                {t("nodemodal_cancel")}
              </button>
              <Button
                onClick={handleDeleteConfirmed}
                className="h-10 bg-red-600 hover:bg-red-700"
              >
                {t("nodemodal_delete_anyway")}
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Dialog>
  );
}
