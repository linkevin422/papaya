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
  { value: "Pocket", icon: Wallet },
  { value: "Platform", icon: Globe },
  { value: "People", icon: Users },
  { value: "Portfolio", icon: Briefcase },
  { value: "Other", icon: HelpCircle },
];

const NODE_HINTS: Record<string, string> = {
  Pocket: "nodemodal_hint_pocket",
  Platform: "nodemodal_hint_platform",
  People: "nodemodal_hint_people",
  Portfolio: "nodemodal_hint_portfolio",
  Other: "nodemodal_hint_other",
};

const supabase = createClient();

export default function NodeModal({ open, onClose, node, refresh }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState(node.name);
  const [type, setType] = useState<string>(node.type || "Platform");
  const [saving, setSaving] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [connectedCount, setConnectedCount] = useState<number | null>(null);

  useEffect(() => {
    setName(node.name);
    setType(node.type || "Platform");
  }, [node]);

  useEffect(() => {
    if (!open || !node.id) return;
    const loadConnections = async () => {
      const { count } = await supabase
        .from("edges")
        .select("id", { count: "exact", head: true })
        .or(`source_id.eq.${node.id},target_id.eq.${node.id}`);
      setConnectedCount(count ?? 0);
    };
    loadConnections();
  }, [open, node.id]);

  const dirty = useMemo(
    () =>
      name.trim() !== (node.name || "").trim() ||
      (type || "") !== (node.type || "Platform"),
    [name, type, node.name, node.type]
  );
  const valid = name.trim().length > 0;

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
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="w-full max-w-sm sm:max-w-md rounded-xl border border-white/10 bg-zinc-950 text-white shadow-2xl max-h-[90dvh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10">
            <Dialog.Title className="truncate text-lg sm:text-xl font-semibold tracking-tight">
              {t("nodemodal_edit_node")}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition text-sm sm:text-base"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-5 space-y-4">
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
                      {t(`nodemodal_type_${tObj.value.toLowerCase()}`)}
                    </option>
                  ))}
                </select>
                <CurrentIcon className="h-5 w-5 text-white/70 flex-shrink-0" />
              </div>
              <p className="mt-1 text-xs text-white/50">
                {t("nodemodal_examples")}: {t(NODE_HINTS[type])}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/60">
                {t("nodemodal_name")}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 bg-zinc-900 border-white/10 text-sm text-white"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <button
                onClick={tryDelete}
                className="h-10 rounded-md border border-red-500/50 px-4 text-red-300 hover:text-red-200 hover:border-red-400 transition w-full sm:w-auto"
              >
                {t("nodemodal_delete_node")}
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="h-10 flex-1 sm:flex-none rounded-md border border-white/10 px-4 text-white hover:text-gray-300"
                >
                  {t("nodemodal_cancel")}
                </button>
                <Button
                  onClick={handleSave}
                  disabled={!valid || !dirty || saving}
                  className="h-10 flex-1 sm:flex-none min-w-[90px]"
                >
                  {saving ? t("nodemodal_saving") : t("nodemodal_save")}
                </Button>
              </div>
            </div>

            {typeof connectedCount === "number" && connectedCount > 0 && (
              <div className="mt-3 text-xs text-red-300 text-center sm:text-left">
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
        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
          <Dialog.Panel className="w-full max-w-sm sm:max-w-md rounded-lg border border-white/10 bg-zinc-950 p-5 sm:p-6 text-white space-y-4 max-h-[90dvh] overflow-y-auto">
            <Dialog.Title className="text-base sm:text-lg font-semibold">
              {t("nodemodal_delete_node_title")}
            </Dialog.Title>
            <p className="text-sm text-white/80 leading-relaxed">
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
            <div className="flex justify-end gap-2 flex-wrap">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                className="h-10 rounded-md border border-white/10 px-4 text-white hover:text-gray-300 w-full sm:w-auto"
              >
                {t("nodemodal_cancel")}
              </button>
              <Button
                onClick={handleDeleteConfirmed}
                className="h-10 bg-red-600 hover:bg-red-700 w-full sm:w-auto"
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
