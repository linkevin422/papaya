"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import FlowCanvas from "./FlowCanvas";
import NodeModal from "@/components/NodeModal";
import EdgeModal from "@/components/EdgeModal";
import AddNodeForm from "./AddNodeForm";
import { MarkerType } from "reactflow";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import TimeframeSwitcher from "@/components/TimeframeSwitcher";
import { useProfile } from "@/context/ProfileProvider";
import { useLanguage } from "@/context/LanguageProvider";
import { getLatestRates } from "@/lib/rates";

import {
  Pencil,
  Wallet,
  Globe,
  Users,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { calculateFlows, convertAmount, Entry } from "@/lib/math";

const supabase = createClient();

type Flow = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  privacy: "private" | "public";
  public_mode: number | null;
  share_id: string;
};

type NodeData = {
  id: string;
  name: string;
  type?: string;
  x?: number | null;
  y?: number | null;
};

type EdgeData = {
  id: string;
  flow_id: string;
  source_id: string;
  target_id: string;
  type: string;
  direction: string | null;
  label?: string | null;
  show_amount?: boolean | null;
  excluded?: boolean | null;
  daily_flow?: number | null;
  monthly_flow?: number | null;
  yearly_flow?: number | null;
  entries_count?: number | null;
  entries?: Entry[]; // ✅ add this
};

const EDGE_COLOR: Record<string, string> = {
  Income: "#22c55e",
  Traffic: "#60a5fa",
  Fuel: "#f97316",
};

const normalizeType = (t?: string) => (t || "").trim();
const normalizeDir = (d?: string | null): "a->b" | "b->a" | "both" | "none" => {
  if (!d) return "a->b";
  const s = d.toLowerCase().trim();
  if (s === "a->b" || s.includes("a → b")) return "a->b";
  if (s === "b->a" || s.includes("b → a")) return "b->a";
  if (s === "both" || s.includes("↔")) return "both";
  if (s === "none") return "none";
  return "a->b";
};

type ViewMode = "daily" | "monthly" | "yearly";

export default function FlowPage() {
  const urlParam = useParams().id as string;
  const qs = useSearchParams();
  const { profile } = useProfile();
  const { t } = useLanguage();

  const [flow, setFlow] = useState<Flow | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);

  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);

  // loading screen
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);

  // headline totals
  const [daily, setDaily] = useState<number>(0);
  const [monthly, setMonthly] = useState<number>(0);
  const [yearly, setYearly] = useState<number>(0);

  // exchange rates
  const [rates, setRates] = useState<Record<string, number>>({});
  useEffect(() => {
    getLatestRates().then(setRates);
  }, []);

  // global view controls
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [showAmounts, setShowAmounts] = useState<boolean>(true);
  const [shareNoAmounts, setShareNoAmounts] = useState<boolean>(false);

  const noAmountsParam = qs?.get("no_amounts") === "1";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setViewerId(data.session?.user?.id ?? null);
    });
  }, []);

  const fetchFlow = async () => {
    setNotFound(false);
    const { data, error } = await supabase
      .from("flows")
      .select("*")
      .eq("id", urlParam)
      .maybeSingle();
    let flowData = data;

    if (!flowData && !error) {
      const res = await supabase
        .from("flows")
        .select("*")
        .eq("share_id", urlParam)
        .maybeSingle();
      flowData = res.data || null;
    }

    if (flowData) setFlow(flowData as Flow);
    else {
      setFlow(null);
      setNotFound(true);
    }
  };

  const fetchNodes = async (fid: string) => {
    const { data } = await supabase
      .from("nodes")
      .select("*")
      .eq("flow_id", fid);
    if (data) setNodes(data);
  };

  const fetchEdges = async (fid: string) => {
    if (!profile?.master_currency) return;
    const masterCurrency = profile.master_currency;

    const { data: base } = await supabase
      .from("edges")
      .select(
        "id,flow_id,source_id,target_id,type,direction,label,show_amount,excluded"
      )
      .eq("flow_id", fid);

    const baseEdges = (base as EdgeData[]) || [];
    if (baseEdges.length === 0) {
      setEdges([]);
      setDaily(0);
      setMonthly(0);
      setYearly(0);
      return;
    }

    const ids = baseEdges.map((e) => e.id);
    const { data: entries } = await supabase
      .from("edge_entries")
      .select(
        "amount, original_amount, original_currency, edge_id, entry_date, recurring_interval"
      )
      .in("edge_id", ids);

    if (!entries) {
      setEdges(baseEdges);
      return;
    }

    const rates = await getLatestRates();
    if (!rates.USD) rates.USD = 1;

    const grouped = new Map<string, Entry[]>();
    for (const row of entries) {
      const srcAmt = (row as any).original_amount ?? row.amount;
      const srcCur = row.original_currency || masterCurrency;
      if (!grouped.has(row.edge_id)) grouped.set(row.edge_id, []);
      grouped.get(row.edge_id)!.push({
        amount: srcAmt,
        currency: srcCur,
        date: row.entry_date || "unknown",
        recurring_interval: row.recurring_interval || null,
      });
    }

    const merged = baseEdges.map((e) => {
      const list = grouped.get(e.id) || [];
      const isExcluded = (e as any).excluded === true;

      const normalized = list.map((entry) => {
        let amt = convertAmount(
          entry.amount,
          entry.currency,
          masterCurrency,
          rates
        );
        if (normalizeType(e.type) === "Fuel") {
          amt = -amt;
        }
        return {
          amount: amt,
          currency: masterCurrency,
          date: entry.date,
          recurring_interval: entry.recurring_interval,
        };
      });

      const hasRecurring = normalized.some((e) => !!e.recurring_interval);
      const flows =
        normalized.length >= 2 || hasRecurring
          ? calculateFlows(normalized, masterCurrency, rates)
          : { daily: 0, monthly: 0, yearly: 0 };

      const flowVals = isExcluded ? { daily: 0, monthly: 0, yearly: 0 } : flows;

      return {
        ...e,
        excluded: isExcluded,
        entries: list,
        daily_flow: flowVals.daily,
        monthly_flow: flowVals.monthly,
        yearly_flow: flowVals.yearly,
        entries_count: normalized.length,
      };
    });

    setEdges(merged);

    const totals = merged.reduce(
      (acc, e) => {
        if (e.excluded) return acc;
        return {
          daily: acc.daily + (e.daily_flow ?? 0),
          monthly: acc.monthly + (e.monthly_flow ?? 0),
          yearly: acc.yearly + (e.yearly_flow ?? 0),
        };
      },
      { daily: 0, monthly: 0, yearly: 0 }
    );
    setDaily(totals.daily);
    setMonthly(totals.monthly);
    setYearly(totals.yearly);
  };

  const refreshCanvas = async (fid: string) => {
    await Promise.all([fetchNodes(fid), fetchEdges(fid)]);
  };

  useEffect(() => {
    if (!urlParam) return;
    setLoading(true);
    fetchFlow().finally(() => setTimeout(() => setLoading(false), 400));
  }, [urlParam]);

  useEffect(() => {
    if (flow?.id) refreshCanvas(flow.id);
    else {
      setNodes([]);
      setEdges([]);
    }
  }, [flow?.id]);

  useEffect(() => {
    if (flow?.id && Object.keys(rates).length > 0 && profile?.master_currency) {
      fetchEdges(flow.id);
    }
  }, [flow?.id, rates, profile?.master_currency]);

  const isOwner = !!flow && !!viewerId && flow.user_id === viewerId;
  const isPublicViewer = !!flow && flow.privacy === "public" && !isOwner;
  const publicMode = flow?.public_mode ?? 1;
  const canOpenDetails = isOwner || (isPublicViewer && publicMode >= 3);

  const showAmountsForViewer =
    (!isPublicViewer && showAmounts) ||
    (isPublicViewer && publicMode >= 2 && !noAmountsParam);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  useEffect(() => {
    if (flow?.name) setNameDraft(flow.name);
  }, [flow?.name]);
  const saveName = async () => {
    if (!flow) return;
    await supabase.from("flows").update({ name: nameDraft }).eq("id", flow.id);
    await fetchFlow();
    setEditingName(false);
  };

  const updatePrivacy = async (next: "private" | "public") => {
    if (!flow) return;
    const patch: any = { privacy: next };
    if (next === "public" && !flow.public_mode) patch.public_mode = 1;
    await supabase.from("flows").update(patch).eq("id", flow.id);
    await fetchFlow();
  };
  const updatePublicMode = async (m: number) => {
    if (!flow) return;
    await supabase.from("flows").update({ public_mode: m }).eq("id", flow.id);
    await fetchFlow();
  };

  const shareUrl =
    typeof window !== "undefined" && flow
      ? `${window.location.origin}/flows/${flow.share_id}${
          shareNoAmounts ? "?no_amounts=1" : ""
        }`
      : "";

  function fmtCurrency(n: number, currency: string) {
    if (!n || !isFinite(n)) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }

  const NODE_STYLE: Record<string, { color: string; icon: any }> = {
    Pocket: { color: "#10b981", icon: Wallet },
    Platform: { color: "#3b82f6", icon: Globe },
    People: { color: "#f59e0b", icon: Users },
    Portfolio: { color: "#8b5cf6", icon: Briefcase },
    Other: { color: "#64748b", icon: HelpCircle },
  };

  const rfNodes = useMemo(
    () =>
      nodes.map((n) => {
        const { color, icon: Icon } =
          NODE_STYLE[normalizeType(n.type)] || NODE_STYLE.Other;
        return {
          id: n.id,
          type: "default",
          data: {
            label: (
              <div
                className="flex items-center gap-2 px-3 py-2 max-w-[200px]"
                title={n.name}
              >
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="truncate min-w-0 font-medium">{n.name}</span>
              </div>
            ),
          },
          position: {
            x: typeof n.x === "number" ? Number(n.x) : Math.random() * 300,
            y: typeof n.y === "number" ? Number(n.y) : Math.random() * 300,
          },
          style: {
            backgroundColor: "#111",
            color: "white",
            borderRadius: 16,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            border: `1px solid ${color}40`,
            fontWeight: 500,
            minWidth: 140,
          },
        };
      }),
    [nodes]
  );

  const rfEdges = useMemo(() => {
    return edges.map((e) => {
      const val =
        viewMode === "daily"
          ? e.daily_flow
          : viewMode === "monthly"
          ? e.monthly_flow
          : e.yearly_flow;

      const dir = normalizeDir(e.direction || undefined);
      const isBoth = dir === "both";
      const isNone = dir === "none";
      const isExcluded = e.excluded === true;

      const stroke = isExcluded
        ? "#ef4444"
        : EDGE_COLOR[normalizeType(e.type)] || "#e5e7eb";

      const shouldShow =
        e.show_amount !== false && showAmountsForViewer && !isExcluded;

      // show if ≥2 entries OR at least one recurring
      const hasRecurring =
        Array.isArray(e.entries) &&
        e.entries.some((entry: any) => !!entry.recurring_interval);
      const hasEnough = (e.entries_count ?? 0) >= 2 || hasRecurring;

      let amountText: string | null = null;
      if (shouldShow && hasEnough && typeof val === "number" && isFinite(val)) {
        const suffix =
          viewMode === "daily"
            ? t("flowpage_perDay")
            : viewMode === "monthly"
            ? t("flowpage_perMonth")
            : t("flowpage_perYear");
        amountText = `${fmtCurrency(
          val,
          profile?.master_currency || "USD"
        )} ${suffix}`;
      }

      return {
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        label: amountText || e.label || undefined,
        animated: !isBoth && !isNone,
        markerStart: isBoth
          ? { type: MarkerType.ArrowClosed, color: stroke }
          : undefined,
        markerEnd: isNone
          ? undefined
          : { type: MarkerType.ArrowClosed, color: stroke },
        style: isNone
          ? { stroke, strokeDasharray: "6 6", strokeWidth: 2 }
          : { stroke, strokeWidth: 2 },
        data: {
          direction: dir,
          linkType: e.type,
          entries_count: e.entries_count ?? 0,
        },
      };
    });
  }, [
    edges,
    viewMode,
    showAmountsForViewer,
    profile?.master_currency,
    daily,
    monthly,
    yearly,
    t,
  ]);

  if (loading) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-black text-white z-50 transition-opacity duration-500">
        <img
          src="/logo/logo.png"
          alt="Papaya logo"
          className="w-20 h-20 animate-pulse opacity-90"
        />
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex h-[70vh] items-center justify-center text-white">
        <div className="rounded-xl border border-white/10 bg-zinc-950/60 px-6 py-5">
          <p className="text-sm text-white/80">{t("flowpage_notFound")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex justify-center w-full text-white">
      <div className="w-full max-w-6xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-black/30">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                {isOwner ? (
                  <div className="flex items-center gap-2">
                    {editingName ? (
                      <>
                        <input
                          className="rounded-md border border-white/15 bg-black/40 px-2 py-1"
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                        />
                        <button
                          onClick={saveName}
                          className="rounded-md border border-white/15 px-2 py-1"
                        >
                          {t("flowpage_save")}
                        </button>
                        <button
                          onClick={() => {
                            setEditingName(false);
                            setNameDraft(flow?.name || "");
                          }}
                          className="rounded-md border border-white/15 px-2 py-1"
                        >
                          {t("flowpage_cancel")}
                        </button>
                      </>
                    ) : (
                      <>
                        <h1 className="truncate text-2xl font-semibold">
                          {flow?.name || "…"}
                        </h1>
                        <button
                          onClick={() => setEditingName(true)}
                          className="rounded-md p-1 text-zinc-400 hover:text-white"
                          title={t("flowpage_rename")}
                        >
                          <Pencil size={16} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <h1 className="truncate text-2xl font-semibold">
                    {flow?.name || "…"}
                  </h1>
                )}

                {(!isPublicViewer || publicMode >= 2) && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium">
                      {viewMode === "daily"
                        ? `${fmtCurrency(
                            daily,
                            profile?.master_currency || "USD"
                          )} ${t("flowpage_perDay")}`
                        : viewMode === "monthly"
                        ? `${fmtCurrency(
                            monthly,
                            profile?.master_currency || "USD"
                          )} ${t("flowpage_perMonth")}`
                        : `${fmtCurrency(
                            yearly,
                            profile?.master_currency || "USD"
                          )} ${t("flowpage_perYear")}`}
                    </span>

                    {isOwner && profile && (
                      <select
                        value={profile.master_currency || "USD"}
                        onChange={async (e) => {
                          const nextCurrency = e.target.value;
                          await supabase
                            .from("profiles")
                            .update({ master_currency: nextCurrency })
                            .eq("id", profile.id);
                          window.location.reload();
                        }}
                        className="rounded-md bg-black/40 border border-white/10 px-2 py-1 text-xs text-white"
                      >
                        <option value="USD">USD</option>
                        <option value="TWD">TWD</option>
                        <option value="CAD">CAD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-3 overflow-x-auto flex-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {isOwner && (
                  <>
                    <div className="flex flex-none items-center gap-2 rounded-md border border-white/15 bg-black/40 p-1">
                      <TimeframeSwitcher
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                      />
                      <div className="h-6 w-px bg-white/10" />
                      <label className="flex items-center gap-1 text-sm px-2">
                        <input
                          type="checkbox"
                          checked={showAmounts}
                          onChange={(e) => setShowAmounts(e.target.checked)}
                          className="accent-white"
                        />
                        {t("flowpage_showAmounts")}
                      </label>
                    </div>

                    <button
                      onClick={() => setVisibilityOpen(true)}
                      className="h-9 flex-none rounded-md border border-white/15 px-3 text-sm hover:bg-white/10"
                    >
                      {flow?.privacy === "public"
                        ? t("flowpage_public")
                        : t("flowpage_private")}
                    </button>

                    <Dialog
                      open={visibilityOpen}
                      onClose={() => setVisibilityOpen(false)}
                      className="fixed inset-0 z-50"
                    >
                      <div className="fixed inset-0 bg-black/70" />
                      <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white">
                          <Dialog.Title className="mb-4 text-lg font-semibold">
                            {t("flowpage_flowVisibility")}
                          </Dialog.Title>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm mb-1">
                                {t("flowpage_privacy")}
                              </label>
                              <select
                                value={flow?.privacy || "private"}
                                onChange={(e) =>
                                  updatePrivacy(
                                    e.target.value as "private" | "public"
                                  )
                                }
                                className="w-full rounded-md bg-black/40 border border-white/10 px-2 py-1 text-sm outline-none"
                              >
                                <option value="private">
                                  {t("flowpage_private")}
                                </option>
                                <option value="public">
                                  {t("flowpage_public")}
                                </option>
                              </select>
                            </div>

                            {flow?.privacy === "public" && (
                              <>
                                <div>
                                  <label className="block text-sm mb-1">
                                    {t("flowpage_publicMode")}
                                  </label>
                                  <select
                                    value={flow.public_mode ?? 1}
                                    onChange={(e) =>
                                      updatePublicMode(Number(e.target.value))
                                    }
                                    className="w-full rounded-md bg-black/40 border border-white/10 px-2 py-1 text-sm outline-none"
                                  >
                                    <option value={1}>
                                      {t("flowpage_noEarnings")}
                                    </option>
                                    <option value={2}>
                                      {t("flowpage_showEarnings")}
                                    </option>
                                    <option value={3}>
                                      {t("flowpage_earningsDetails")}
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm mb-1">
                                    {t("flowpage_shareLink")}
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      readOnly
                                      value={shareUrl}
                                      className="h-9 flex-1 truncate rounded-md border border-white/15 bg-black/40 px-2 text-sm"
                                    />
                                    <button
                                      onClick={async () => {
                                        if (shareUrl)
                                          await navigator.clipboard.writeText(
                                            shareUrl
                                          );
                                      }}
                                      className="h-9 flex-none rounded-md border border-white/15 px-3 text-sm hover:bg-white/10"
                                    >
                                      {t("flowpage_copy")}
                                    </button>
                                  </div>
                                  <label className="mt-2 inline-flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="accent-white"
                                      checked={shareNoAmounts}
                                      onChange={(e) =>
                                        setShareNoAmounts(e.target.checked)
                                      }
                                    />
                                    {t("flowpage_hideAmounts")}
                                  </label>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="mt-6 flex justify-end gap-2">
                            <button
                              onClick={() => setVisibilityOpen(false)}
                              className="rounded-md border border-white/15 px-3 py-1"
                            >
                              {t("flowpage_close")}
                            </button>
                          </div>
                        </Dialog.Panel>
                      </div>
                    </Dialog>
                    <Button
                      onClick={() => setShowAddNode(true)}
                      className="h-9 flex-none bg-emerald-600 px-3 text-sm hover:bg-emerald-700"
                      title={t("flowpage_addNode")}
                    >
                      + {t("flowpage_addNode")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="mx-auto max-w-6xl px-4 py-4">
          <FlowCanvas
            flowId={flow?.id || urlParam}
            nodes={rfNodes}
            edges={rfEdges}
            onNodeClick={(rfNode) => {
              if (!canOpenDetails) return;
              const actual = nodes.find((n) => n.id === rfNode.id);
              if (actual) setSelectedNode(actual);
            }}
            onEdgeClick={(rfEdge) => {
              if (!canOpenDetails) return;
              const real = edges.find((e) => e.id === rfEdge.id);
              if (real) setSelectedEdge(real);
            }}
            refresh={() =>
              flow?.id ? refreshCanvas(flow.id) : Promise.resolve()
            }
            viewMode={viewMode}
          />
        </div>

        {/* Add Node Modal */}
        <Dialog
          open={showAddNode}
          onClose={() => setShowAddNode(false)}
          className="fixed inset-0 z-50"
        >
          <div className="fixed inset-0 bg-black/70" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white">
              <Dialog.Title className="mb-4 text-lg font-semibold">
                {t("flowpage_addNewNode")}
              </Dialog.Title>
              {isOwner && flow && flow.user_id && (
                <AddNodeForm
                  flowId={flow.id}
                  userId={flow.user_id}
                  onNodeAdded={() => {
                    if (flow?.id) refreshCanvas(flow.id);
                    setShowAddNode(false);
                  }}
                />
              )}
              <div className="mt-4 text-right">
                <button
                  onClick={() => setShowAddNode(false)}
                  className="rounded-md border border-white/10 px-4 py-2 text-white hover:text-gray-300"
                >
                  {t("flowpage_cancel")}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Modals */}
        {selectedNode && canOpenDetails && (
          <NodeModal
            open={true}
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            refresh={() =>
              flow?.id ? refreshCanvas(flow.id) : Promise.resolve()
            }
          />
        )}

        {selectedEdge && canOpenDetails && (
          <EdgeModal
            open={true}
            edge={selectedEdge}
            nodes={nodes}
            onClose={() => setSelectedEdge(null)}
            refresh={() =>
              flow?.id ? refreshCanvas(flow.id) : Promise.resolve()
            }
          />
        )}
      </div>
    </main>
  );
}
