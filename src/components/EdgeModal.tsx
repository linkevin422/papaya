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

  // profile master currency
  const [masterCurrency, setMasterCurrency] = useState<string>("TWD");

  const [rates, setRates] = useState<Record<string, number>>({});
  const [flows, setFlows] = useState<{
    daily: number;
    monthly: number;
    yearly: number;
  } | null>(null);

  const nameOf = (id: string) =>
    nodes.find((n) => n.id === id)?.name || "Unknown";
  const aName = useMemo(() => nameOf(edge.source_id), [edge.source_id, nodes]);
  const bName = useMemo(() => nameOf(edge.target_id), [edge.target_id, nodes]);

  const hasEntries = entries.length > 0;

  // ----- helpers -----
  const effectiveRates = useCallback(() => {
    // Do NOT override existing values. Just ensure essentials exist.
    const r = { ...rates };
    if (!r["USD"]) r["USD"] = 1; // most tables are normalized to USD
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
      .select("amount, original_amount, original_currency, entry_date")
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
    }));

    const totals = calculateFlows(normalized, masterCurrency, r);
    setFlows(totals);

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

    // Take only the left side before "≈", if present
    let amtStr = newAmount.split("≈")[0].trim();
    // Strip currency symbols/letters, keep digits and dot
    amtStr = amtStr.replace(/[A-Za-z$€£¥₩]/g, "").trim();
    // Normalize commas to dot and strip everything else
    amtStr = amtStr.replace(/,/g, ".").replace(/[^\d.]/g, "");

    const amt = Number(amtStr);
    if (!newDate || !amtStr || Number.isNaN(amt)) return;

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) return;
    const userId = userData.user?.id;
    if (!userId) return;

    const { error } = await supabase.rpc("add_edge_entry", {
      p_user_id: userId,
      p_edge_id: String(edge.id),
      p_entry_date: newDate,
      p_original_amount: amt,
      p_original_currency: newCurrency,
      p_note: newNote.trim() || null,
    });
    if (error) return;

    setNewAmount("");
    setNewNote("");
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
    typeof n === "number" ? `${cur || ""} ${n.toFixed(2)}` : "N/A";

  const formatCurrency = (amt: number | null | undefined, cur: string) =>
    typeof amt === "number"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: cur,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amt)
      : "N/A";

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
                Edit Link
              </Dialog.Title>
              <div className="text-sm text-white/70 truncate">
                <span className="font-medium">{aName}</span>
                <span className="mx-2 text-white/50">→</span>
                <span className="font-medium">{bName}</span>
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
                title="Switch type"
              >
                <option value="Income">Income</option>
                <option value="Traffic">Traffic</option>
                <option value="Fuel">Fuel</option>
              </select>

              <button
                onClick={() => setConfirmingDeleteEdge(true)}
                className="h-9 rounded-md border border-red-500/30 px-3 text-sm text-red-300 hover:bg-red-500/10"
                title="Delete link and all its data"
              >
                Delete Link
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
                  Exclude from totals
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
                  Show amount on edge
                </label>
              </div>
            )}

            {/* TYPE == Traffic notice */}
            {type === "Traffic" ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-white/80">
                  This link is marked as{" "}
                  <span className="font-semibold">Traffic</span>. It carries no
                  money entries.
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
                      placeholder="Amount"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
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
                    placeholder="Note (optional)"
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
                    Add
                  </button>
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
                      Select all on page
                    </label>

                    {selectedIds.size > 0 && (
                      <Button
                        onClick={bulkDeleteEntries}
                        className="bg-red-600 hover:bg-red-700 text-white h-8 px-3 text-xs"
                      >
                        Delete {selectedIds.size} selected
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Filter notes…"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="h-8 w-40"
                    />
                    <button
                      onClick={() => setSortAsc((s) => !s)}
                      className="h-8 w-8 flex items-center justify-center rounded-md border border-white/15 hover:bg-white/10"
                      title={sortAsc ? "Oldest first" : "Newest first"}
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
                    <div className="p-4 text-sm text-white/70">No entries.</div>
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
                            <div className="font-medium">{en.entry_date}</div>
                            <div className="text-white/70">
                              {en.note || (
                                <span className="italic text-white/50">
                                  No note
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

                            {/* show ≈ in master currency ONLY if different currency */}
                            {(() => {
                              const r = effectiveRates();
                              const src =
                                en.original_currency || masterCurrency;
                              if (!src || src === masterCurrency) return ""; // skip if same currency
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
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  {loadingEntries && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-sm text-white/70">
                      Refreshing…
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
                      Daily: {formatCurrency(flows.daily, masterCurrency)}
                    </div>
                    <div>
                      Monthly: {formatCurrency(flows.monthly, masterCurrency)}
                    </div>
                    <div>
                      Yearly: {formatCurrency(flows.yearly, masterCurrency)}
                    </div>
                  </div>
                ) : (
                  <div className="italic text-white/60">
                    No flow data available.
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
                      Switch link type to {confirmingSwitchType}?
                    </p>
                    <p className="mt-1 text-sm">
                      Switching between Income and Traffic will change how this
                      link behaves.
                      {confirmingSwitchType === "Traffic" &&
                        " Moving to Traffic will delete all existing entries on this link."}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => performSwitchType(confirmingSwitchType)}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Confirm switch
                      </Button>
                      <Button
                        onClick={() => setConfirmingSwitchType(null)}
                        className="border border-white/15 bg-transparent"
                      >
                        Cancel
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
                    <p className="font-semibold">Delete this link?</p>
                    <p className="mt-1 text-sm">
                      This will permanently delete {entries.length} entr
                      {entries.length === 1 ? "y" : "ies"} attached to this link
                      and the link itself.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={actuallyDeleteEdge}
                        className="bg-red-700 hover:bg-red-800 text-white"
                      >
                        Confirm delete
                      </Button>
                      <Button
                        onClick={() => setConfirmingDeleteEdge(false)}
                        className="border border-white/15 bg-transparent"
                      >
                        Cancel
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
                  Master currency:{" "}
                  <span className="font-semibold text-white">
                    {masterCurrency}
                  </span>
                </span>
              ) : (
                <span>Traffic link, no monetary entries.</span>
              )}
            </div>

            <button
              onClick={onClose}
              className="bg-transparent text-white hover:text-gray-300 px-4 py-2 rounded-md border border-white/10"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
