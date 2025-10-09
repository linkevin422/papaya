"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Globe, Users, Briefcase, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

type Props = {
  flowId: string;
  userId: string;
  onNodeAdded: () => void;
};

const NODE_TYPES = [
  {
    value: "Pocket",
    labelKey: "addnode_type_pocket",
    icon: Wallet,
    hintKey: "addnode_type_hint_pocket",
  },
  {
    value: "Platform",
    labelKey: "addnode_type_platform",
    icon: Globe,
    hintKey: "addnode_type_hint_platform",
  },
  {
    value: "People",
    labelKey: "addnode_type_people",
    icon: Users,
    hintKey: "addnode_type_hint_people",
  },
  {
    value: "Portfolio",
    labelKey: "addnode_type_portfolio",
    icon: Briefcase,
    hintKey: "addnode_type_hint_portfolio",
  },
  {
    value: "Other",
    labelKey: "addnode_type_other",
    icon: HelpCircle,
    hintKey: "addnode_type_hint_other",
  },
];

export default function AddNodeForm({ flowId, userId, onNodeAdded }: Props) {
  const supabase = createClient();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [type, setType] = useState<string>(NODE_TYPES[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const nameClean = useMemo(() => name.trim(), [name]);
  const valid =
    nameClean.length > 0 && NODE_TYPES.some((t) => t.value === type);

  useEffect(() => {
    if (touched) setError(null);
  }, [name, type, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("nodes").insert([
      {
        name: nameClean,
        type,
        flow_id: flowId,
        user_id: userId,
        x: 0,
        y: 0,
      },
    ]);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setName("");
    setType(NODE_TYPES[0].value);
    setLoading(false);
    onNodeAdded();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-md mx-auto space-y-5 px-3 sm:px-0 py-2 sm:py-0 overflow-y-auto max-h-[80dvh]"
    >
      {/* Name */}
      <div className="space-y-2">
        <Label
          htmlFor="node-name"
          className="text-white/80 text-xs uppercase tracking-wider"
        >
          {t("addnode_name_label")}
        </Label>
        <Input
          id="node-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("addnode_name_placeholder")}
          aria-invalid={touched && !nameClean ? "true" : "false"}
          className="h-10 bg-zinc-900 border-white/10 text-sm text-white"
        />
        {touched && !nameClean && (
          <p className="text-xs text-red-300">{t("addnode_name_error")}</p>
        )}
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label
          htmlFor="node-type"
          className="text-white/80 text-xs uppercase tracking-wider"
        >
          {t("addnode_type_label")}
        </Label>
        <div className="flex items-center gap-2">
          <select
            id="node-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 flex-1 rounded-lg bg-zinc-900 px-3 text-sm text-white outline-none border border-white/10 focus:ring-2 focus:ring-white/20"
          >
            {NODE_TYPES.map((tObj) => (
              <option key={tObj.value} value={tObj.value}>
                {t(tObj.labelKey)}
              </option>
            ))}
          </select>
          {(() => {
            const CurrentIcon =
              NODE_TYPES.find((t) => t.value === type)?.icon || HelpCircle;
            return (
              <CurrentIcon className="h-5 w-5 text-white/70 flex-shrink-0" />
            );
          })()}
        </div>
        <p className="mt-1 text-xs text-white/50">
          {t(NODE_TYPES.find((t) => t.value === type)?.hintKey || "")}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button
          type="submit"
          disabled={!valid || loading}
          className="h-10 w-full sm:w-auto"
        >
          {loading ? t("addnode_button_adding") : t("addnode_button_add")}
        </Button>
      </div>
    </form>
  );
}
