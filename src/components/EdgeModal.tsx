"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { Trash2, PlusCircle, AlertTriangle } from "lucide-react";
import { convertAmount, calculateFlows } from "@/lib/math";
import { getLatestRates } from "@/lib/rates";
import { useLanguage } from "@/context/LanguageProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  edge: {
    id: string;
    source_id: string;
    target_id: string;
    type: string | null;
    direction: string | null;
    label?: string | null;
    show_amount?: boolean | null;
    excluded?: boolean | null; // <—
  };
  nodes: { id: string; name: string }[];
  refresh: () => void;
};

type Entry = {
  id: string;
  edge_id: string;
  entry_date: string;
  amount: number;
  note: string | null;
  created_at: string;
  original_amount?: number;
  original_currency?: string;
  converted_amount?: number;
  recurring_interval?: "daily" | "monthly" | "yearly" | null; // ✅ new
};

type EdgeRecurring = {
  edge_id: string;
  daily_flow: number | null;
  monthly_flow: number | null;
  yearly_flow: number | null;
  entries_count: number;
};

const supabase = createClient();

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-zinc-800 px-2.5 py-1 text-xs text-white/80">
      {children}
    </span>
  );
}

export default function EdgeModal({
  open,
  onClose,
  edge,
  nodes,
  refresh,
}: Props) {
  const { t } = useLanguage();

  // local copy of edge for instant UI updates
  const [localEdge, setLocalEdge] = useState(edge);

  useEffect(() => {
    setLocalEdge(edge); // resync when modal reopens or prop changes
  }, [edge]);

  // edge meta
  const [type, setType] = useState<"Income" | "Traffic" | "Fuel">(
    (edge.type as any) || "Traffic"
  );
  const [dir, setDir] = useState<"a->b" | "b->a" | "both" | "none">(
    (edge.direction as any) || "a->b"
  );
  const [label, setLabel] = useState<string>(edge.label || "");
  const [showAmount, setShowAmount] = useState<boolean>(
    edge.show_amount ?? true
  );
  const [excluded, setExcluded] = useState<boolean>(!!edge.excluded); // <—

  // entries
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadingRecurring, setLoadingRecurring] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortAsc, setSortAsc] = useState(false);
  const [filterText, setFilterText] = useState("");

  // confirmations
  const [confirmingDeleteEdge, setConfirmingDeleteEdge] = useState(false);
  const [confirmingSwitchType, setConfirmingSwitchType] = useState<
    null | "Income" | "Traffic" | "Fuel"
  >(null);

  const [recurring, setRecurring] = useState<EdgeRecurring | null>(null);

  // new entry inputs
  const [newAmount, setNewAmount] = useState<string>("");
  const [newCurrency, setNewCurrency] = useState<string>("TWD");
  const [newDate, setNewDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [newNote, setNewNote] = useState<string>("");

  // recurring entry state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<
    "daily" | "monthly" | "yearly"
  >("monthly");

  // profile master currency
  const [masterCurrency, setMasterCurrency] = useState<string>("TWD");

  const [rates, setRates] = useState<Record<string, number>>({});
  const [flows, setFlows] = useState<{
    daily: number;
    monthly: number;
    yearly: number;
  } | null>(null);

  const nameOf = (id: string) =>
    nodes.find((n) => n.id === id)?.name || t("edgemodal_unknown");
  const aName = useMemo(() => nameOf(edge.source_id), [edge.source_id, nodes]);
  const bName = useMemo(() => nameOf(edge.target_id), [edge.target_id, nodes]);

  const hasEntries = entries.length > 0;

  // ----- helpers -----
  const effectiveRates = useCallback(() => {
    const r = { ...rates };
    if (!r["USD"]) r["USD"] = 1;
    if (!r[masterCurrency]) r[masterCurrency] = r[masterCurrency] ?? 1;
    return r;
  }, [rates, masterCurrency]);

  // load profile master currency
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const id = userData.user?.id;
      if (!id) return;

      const { data } = await supabase
        .from("profiles")
        .select("master_currency")
        .eq("id", id)
        .single();

      if (data?.master_currency) {
        setMasterCurrency(data.master_currency);
        setNewCurrency(data.master_currency);
      }
    })();
  }, []);

  // load rates once
  useEffect(() => {
    (async () => {
      const latest = await getLatestRates();
      setRates(latest || {});
    })();
  }, []);

  // loaders
  const loadEntries = useCallback(async () => {
    if (!edge.id) return;
    setLoadingEntries(true);

    const { data } = await supabase
      .from("edge_entries")
      .select("*")
      .eq("edge_id", edge.id)
      .order("entry_date", { ascending: false });

    if (data) setEntries(data as any);
    setLoadingEntries(false);
  }, [edge.id]);

  const loadRecurring = useCallback(async () => {
    if (!edge.id) return;
    if (!masterCurrency) return;
    const r = effectiveRates();
    if (Object.keys(r).length === 0) return;

    setLoadingRecurring(true);

    const { data } = await supabase
      .from("edge_entries")
      .select(
        "amount, original_amount, original_currency, entry_date, recurring_interval"
      )
      .eq("edge_id", edge.id);

    const rows = data || [];

    // Convert each entry into master currency
    const normalized = rows.map((e) => ({
      amount: convertAmount(
        e.original_amount ?? e.amount,
        e.original_currency || masterCurrency,
        masterCurrency,
        r
      ),
      currency: masterCurrency,
      date: e.entry_date,
      recurring_interval: e.recurring_interval,
    }));

    const hasRecurring = normalized.some((e) => !!e.recurring_interval);
    if (normalized.length < 2 && !hasRecurring) {
      setFlows(null);
    } else {
      const totals = calculateFlows(normalized, masterCurrency, r);
      setFlows(totals);
    }

    setLoadingRecurring(false);
  }, [edge.id, masterCurrency, effectiveRates]);
  // open → load entries; once entries + rates + masterCurrency are all ready → compute flows
  useEffect(() => {
    if (open && edge.id) loadEntries();
  }, [open, edge.id, loadEntries]);

  useEffect(() => {
    if (!open) return;
    if (!edge.id) return;
    if (!masterCurrency) return;
    if (!hasEntries) return;
    if (Object.keys(rates).length === 0) return;
    loadRecurring();
  }, [open, edge.id, hasEntries, masterCurrency, rates, loadRecurring]);

  // add entry (RPC saves raw amount & currency; we re-read and recompute)
  const addEntry = async () => {
    if (type === "Traffic") return;

    let amtStr = newAmount.split("≈")[0].trim();
    amtStr = amtStr.replace(/[A-Za-z$€£¥₩]/g, "").trim();
    amtStr = amtStr.replace(/,/g, ".").replace(/[^\d.]/g, "");

    const amt = Number(amtStr);
    if (!newDate || !amtStr || Number.isNaN(amt)) return;

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("Auth error:", userErr);
      return;
    }
    const userId = userData.user?.id;
    if (!userId) {
      console.error("No user ID found");
      return;
    }

    const { error } = await supabase.rpc("add_edge_entry", {
      p_user_id: userId,
      p_edge_id: String(edge.id),
      p_entry_date: newDate,
      p_original_amount: amt,
      p_original_currency: newCurrency,
      p_note: newNote.trim() || null,
      p_recurring_interval: isRecurring ? recurringInterval : null,
    });

    if (error) {
      console.error("add_edge_entry failed:", error);
      return;
    }

    if (isRecurring) {
      const { error: recErr } = await supabase
        .from("recurring_entries")
        .insert({
          edge_id: edge.id,
          user_id: userId,
          amount: amt,
          currency: newCurrency,
          interval: recurringInterval,
          note: newNote.trim() || null,
        });

      if (recErr) {
        console.error("Failed to insert recurring entry:", recErr);
      }
    }

    setNewAmount("");
    setNewNote("");
    setIsRecurring(false);
    await loadEntries();
    await loadRecurring();
    await refresh();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("edge_entries").delete().eq("id", id);
    await loadEntries();
    await loadRecurring();
    await refresh();
  };

  const bulkDeleteEntries = async () => {
    if (selectedIds.size === 0) return;
    await supabase
      .from("edge_entries")
      .delete()
      .in("id", Array.from(selectedIds));
    setSelectedIds(new Set());
    await loadEntries();
    await loadRecurring();
    await refresh();
  };

  const actuallyDeleteEdge = async () => {
    await supabase.from("edge_entries").delete().eq("edge_id", edge.id);
    await supabase.from("edges").delete().eq("id", edge.id);
    setConfirmingDeleteEdge(false);
    onClose();
    await refresh();
  };

  const performSwitchType = async (nextType: "Income" | "Traffic" | "Fuel") => {
    if (nextType === "Traffic") {
      await supabase.from("edge_entries").delete().eq("edge_id", edge.id);
    }

    const { error } = await supabase
      .from("edges")
      .update({ type: nextType })
      .eq("id", edge.id);

    if (error) {
      console.error("Failed to switch type:", error);
      return;
    }

    setType(nextType);
    setConfirmingSwitchType(null);
    await loadEntries();
    await loadRecurring();
    await refresh();
  };

  const fmtMoney = (n: number | null | undefined, cur?: string) =>
    typeof n === "number" ? `${cur || ""} ${n.toFixed(2)}` : t("edgemodal_na");

  const formatCurrency = (amt: number | null | undefined, cur: string) =>
    typeof amt === "number"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: cur,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amt)
      : t("edgemodal_na");

  const sortedFiltered = useMemo(() => {
    const filtered = filterText
      ? entries.filter((e) =>
          (e.note || "").toLowerCase().includes(filterText.toLowerCase())
        )
      : entries;
    const sorted = [...filtered].sort((a, b) => {
      const da = a.entry_date;
      const db = b.entry_date;
      return sortAsc ? da.localeCompare(db) : db.localeCompare(da);
    });
    return sorted;
  }, [entries, sortAsc, filterText]);

  const allOnPageIds = useMemo(
    () => sortedFiltered.map((e) => e.id),
    [sortedFiltered]
  );
  const allSelectedOnPage =
    allOnPageIds.length > 0 && allOnPageIds.every((id) => selectedIds.has(id));

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/70" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-zinc-950 text-white w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-white/10">
            <div className="min-w-0">
              <Dialog.Title className="text-xl font-semibold tracking-tight truncate">
                {t("edgemodal_edit_link")}
              </Dialog.Title>
              <div className="text-sm text-white/70 flex items-center gap-2">
                <select
                  value={localEdge.source_id}
                  onChange={async (e) => {
                    const newSource = e.target.value;
                    setLocalEdge((prev) => ({ ...prev, source_id: newSource }));
                    await supabase
                      .from("edges")
                      .update({ source_id: newSource })
                      .eq("id", edge.id);
                    refresh();
                  }}
                  className="bg-transparent font-medium border-none outline-none"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id} className="bg-zinc-900">
                      {n.name}
                    </option>
                  ))}
                </select>

                <span className="mx-1 text-white/50">→</span>

                <select
                  value={localEdge.target_id}
                  onChange={async (e) => {
                    const newTarget = e.target.value;
                    setLocalEdge((prev) => ({ ...prev, target_id: newTarget }));
                    await supabase
                      .from("edges")
                      .update({ target_id: newTarget })
                      .eq("id", edge.id);
                    refresh();
                  }}
                  className="bg-transparent font-medium border-none outline-none"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id} className="bg-zinc-900">
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2">
              <select
                value={type}
                onChange={(e) => {
                  const next = e.target.value as "Income" | "Traffic" | "Fuel";
                  if (next === type) return;
                  setConfirmingSwitchType(next);
                }}
                className="h-9 rounded-md bg-black/40 border border-white/15 px-2 text-sm"
                title={t("edgemodal_switch_type")}
              >
                <option value="Income">{t("edgemodal_income")}</option>
                <option value="Traffic">{t("edgemodal_traffic")}</option>
                <option value="Fuel">{t("edgemodal_fuel")}</option>
              </select>

              <button
                onClick={() => setConfirmingDeleteEdge(true)}
                className="h-9 rounded-md border border-red-500/30 px-3 text-sm text-red-300 hover:bg-red-500/10"
                title={t("edgemodal_delete_link_title")}
              >
                {t("edgemodal_delete_link")}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Top meta row */}
            {type !== "Traffic" && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={excluded}
                    onChange={async (e) => {
                      setExcluded(e.target.checked);
                      await supabase
                        .from("edges")
                        .update({ excluded: e.target.checked })
                        .eq("id", edge.id);
                      await refresh();
                    }}
                    className="accent-red-500"
                  />
                  {t("edgemodal_exclude_from_totals")}
                </label>

                <label className="ml-auto inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={showAmount}
                    onChange={async (e) => {
                      setShowAmount(e.target.checked);
                      await supabase
                        .from("edges")
                        .update({ show_amount: e.target.checked })
                        .eq("id", edge.id);
                      await refresh();
                    }}
                    className="accent-white"
                  />
                  {t("edgemodal_show_amount")}
                </label>
              </div>
            )}
            {/* TYPE == Traffic notice */}
            {type === "Traffic" ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-white/80">
                  {t("edgemodal_traffic_notice")}{" "}
                  <span className="font-semibold">
                    {t("edgemodal_traffic")}
                  </span>
                  . {t("edgemodal_no_money_entries")}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add entry row */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_1fr_auto] gap-2">
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-10"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={t("edgemodal_amount")}
                      value={newAmount}
                      onChange={(e) => {
                        let val = e.target.value;

                        if (!/^\d*\.?\d*$/.test(val)) return;
                        if (
                          val.startsWith("0") &&
                          !val.startsWith("0.") &&
                          val !== ""
                        ) {
                          val = String(parseFloat(val));
                        }
                        if (val.includes(".")) {
                          const [intPart, decPart] = val.split(".");
                          if (decPart.length > 2) return;
                        }
                        const num = parseFloat(val);
                        if (!isNaN(num) && num > 100_000_000) return;
                        setNewAmount(val);
                      }}
                      onBlur={() => {
                        if (newAmount === "") return;
                        const num = parseFloat(newAmount);
                        if (isNaN(num) || num === 0) {
                          setNewAmount("");
                          return;
                        }
                        setNewAmount(num.toFixed(2));
                      }}
                      className="h-10 flex-1"
                    />

                    {(() => {
                      const baseCurrencies: string[] = [
                        "TWD",
                        "USD",
                        "EUR",
                        "JPY",
                        "CAD",
                        "GBP",
                      ];
                      const currencies = [masterCurrency, ...baseCurrencies];
                      const uniqueCurrencies: string[] = Array.from(
                        new Set(currencies)
                      );

                      return (
                        <select
                          value={newCurrency}
                          onChange={(e) => setNewCurrency(e.target.value)}
                          className="rounded-lg bg-zinc-900 border border-white/10 px-2 text-sm text-white"
                        >
                          {uniqueCurrencies.map((cur: string) => (
                            <option key={cur} value={cur}>
                              {cur}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                  <Input
                    placeholder={t("edgemodal_note_optional")}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="h-10"
                  />
                  <button
                    onClick={addEntry}
                    disabled={
                      !newDate || !newAmount || Number.isNaN(Number(newAmount))
                    }
                    className={cx(
                      "h-10 rounded-lg px-3 inline-flex items-center gap-2 border transition",
                      "border-white/20 text-white/90 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    <PlusCircle className="h-4 w-4" />
                    {t("edgemodal_add")}
                  </button>

                  {/* Recurring toggle */}
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                    {isRecurring ? (
                      <>
                        <span>{t("edgemodal_recurring")}</span>
                        <select
                          value={recurringInterval}
                          onChange={(e) =>
                            setRecurringInterval(
                              e.target.value as "daily" | "monthly" | "yearly"
                            )
                          }
                          className="rounded-md bg-zinc-900 border border-white/10 px-2 py-1 text-xs"
                        >
                          <option value="daily">{t("edgemodal_daily")}</option>
                          <option value="monthly">
                            {t("edgemodal_monthly")}
                          </option>
                          <option value="yearly">
                            {t("edgemodal_yearly")}
                          </option>
                        </select>
                      </>
                    ) : (
                      <span>{t("edgemodal_make_recurring")}</span>
                    )}
                  </div>
                </div>

                {/* Entries toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-black/30 p-2">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(new Set(allOnPageIds));
                          } else {
                            const next = new Set(selectedIds);
                            allOnPageIds.forEach((id) => next.delete(id));
                            setSelectedIds(next);
                          }
                        }}
                      />
                      {t("edgemodal_select_all_on_page")}
                    </label>

                    {selectedIds.size > 0 && (
                      <Button
                        onClick={bulkDeleteEntries}
                        className="bg-red-600 hover:bg-red-700 text-white h-8 px-3 text-xs"
                      >
                        {t("edgemodal_delete_selected", {
                          count: String(selectedIds.size),
                        })}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t("edgemodal_filter_notes")}
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="h-8 w-40"
                    />
                    <button
                      onClick={() => setSortAsc((s) => !s)}
                      className="h-8 w-8 flex items-center justify-center rounded-md border border-white/15 hover:bg-white/10"
                      title={
                        sortAsc
                          ? t("edgemodal_oldest_first")
                          : t("edgemodal_newest_first")
                      }
                    >
                      {sortAsc ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Entries list */}
                <div className="relative divide-y divide-white/5">
                  {sortedFiltered.length === 0 ? (
                    <div className="p-4 text-sm text-white/70">
                      {t("edgemodal_no_entries")}
                    </div>
                  ) : (
                    sortedFiltered.map((en) => (
                      <div
                        key={en.id}
                        className="px-3 py-3 flex items-center justify-between hover:bg-white/[0.03]"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(en.id)}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(en.id);
                              else next.delete(en.id);
                              setSelectedIds(next);
                            }}
                          />
                          <div className="text-sm">
                            <div className="font-medium flex items-center gap-2">
                              {en.entry_date}
                              {en.recurring_interval && (
                                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-300">
                                  {t(`edgemodal_${en.recurring_interval}`)}
                                </span>
                              )}
                            </div>
                            <div className="text-white/70">
                              {en.note || (
                                <span className="italic text-white/50">
                                  {t("edgemodal_no_note")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">
                            {type === "Fuel"
                              ? `-${fmtMoney(
                                  en.original_amount ?? en.amount,
                                  en.original_currency
                                )}`
                              : fmtMoney(
                                  en.original_amount ?? en.amount,
                                  en.original_currency
                                )}

                            {(() => {
                              const r = effectiveRates();
                              const src =
                                en.original_currency || masterCurrency;
                              if (!src || src === masterCurrency) return "";
                              const conv = convertAmount(
                                en.original_amount ?? en.amount,
                                src,
                                masterCurrency,
                                r
                              );
                              if (isNaN(conv)) return "";
                              return ` ≈ ${
                                type === "Fuel"
                                  ? `-${fmtMoney(conv, masterCurrency)}`
                                  : fmtMoney(conv, masterCurrency)
                              }`;
                            })()}
                          </div>
                          <button
                            onClick={() => deleteEntry(en.id)}
                            className="inline-flex items-center text-red-400 hover:text-red-300"
                            title={t("edgemodal_delete_entry")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  {loadingEntries && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-sm text-white/70">
                      {t("edgemodal_refreshing")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flows summary */}
            {type !== "Traffic" && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {flows ? (
                  <div className="space-y-1">
                    <div>
                      {t("edgemodal_daily")}:{" "}
                      {formatCurrency(flows.daily, masterCurrency)}
                    </div>
                    <div>
                      {t("edgemodal_monthly")}:{" "}
                      {formatCurrency(flows.monthly, masterCurrency)}
                    </div>
                    <div>
                      {t("edgemodal_yearly")}:{" "}
                      {formatCurrency(flows.yearly, masterCurrency)}
                    </div>
                  </div>
                ) : (
                  <div className="italic text-white/60">
                    {t("edgemodal_no_flow_data")}
                  </div>
                )}
              </div>
            )}
            {/* Confirm switch type */}
            {confirmingSwitchType && (
              <div className="rounded-lg border border-amber-400/30 bg-amber-900/30 p-4 text-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 flex-none" />
                  <div>
                    <p className="font-semibold">
                      {t("edgemodal_switch_link_type", {
                        type: confirmingSwitchType,
                      })}
                    </p>
                    <p className="mt-1 text-sm">
                      {t("edgemodal_switch_notice")}
                      {confirmingSwitchType === "Traffic" &&
                        t("edgemodal_switch_delete_warning")}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => performSwitchType(confirmingSwitchType)}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {t("edgemodal_confirm_switch")}
                      </Button>
                      <Button
                        onClick={() => setConfirmingSwitchType(null)}
                        className="border border-white/15 bg-transparent"
                      >
                        {t("edgemodal_cancel")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm delete edge */}
            {confirmingDeleteEdge && (
              <div className="rounded-lg border border-red-500/30 bg-red-900/30 p-4 text-red-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 flex-none" />
                  <div>
                    <p className="font-semibold">
                      {t("edgemodal_delete_link")}
                    </p>
                    <p className="mt-1 text-sm">
                      {t("edgemodal_delete_notice", {
                        count: String(entries.length),
                        suffix: entries.length === 1 ? "y" : "ies",
                      })}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={actuallyDeleteEdge}
                        className="bg-red-700 hover:bg-red-800 text-white"
                      >
                        {t("edgemodal_confirm_delete")}
                      </Button>
                      <Button
                        onClick={() => setConfirmingDeleteEdge(false)}
                        className="border border-white/15 bg-transparent"
                      >
                        {t("edgemodal_cancel")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/60">
              {type !== "Traffic" ? (
                <span>
                  {t("edgemodal_master_currency")}:{" "}
                  <span className="font-semibold text-white">
                    {masterCurrency}
                  </span>
                </span>
              ) : (
                <span>{t("edgemodal_traffic_no_entries")}</span>
              )}
            </div>

            <button
              onClick={onClose}
              className="bg-transparent text-white hover:text-gray-300 px-4 py-2 rounded-md border border-white/10"
            >
              {t("edgemodal_close")}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
